# backend/database.py

import sqlite3
from contextlib import contextmanager
from typing import List, Dict, Optional, Any
from datetime import datetime
import json


class Database:
    """Database manager for M&A Synergies tool"""
    
    def __init__(self, db_path: str = "synergies.db"):
        """Initialize database connection
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.init_database()
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections
        
        Yields:
            sqlite3.Connection: Database connection
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def init_database(self):
        """Initialize database and create tables if they don't exist"""
        self.create_tables()
    
    def create_tables(self):
        """Create all required tables for the synergies tool"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Synergies table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS synergies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    function TEXT NOT NULL,
                    synergy_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    implementation_timeline TEXT NOT NULL,
                    risk_level TEXT NOT NULL,
                    potential_savings_min REAL NOT NULL,
                    potential_savings_max REAL NOT NULL,
                    industry_applicability TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes for better query performance
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_function 
                ON synergies(function)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_synergy_type 
                ON synergies(synergy_type)
            """)
            
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_risk_level 
                ON synergies(risk_level)
            """)
            
            # Projects table (for tracking synergy implementation)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_name TEXT NOT NULL,
                    target_company TEXT NOT NULL,
                    acquirer_company TEXT NOT NULL,
                    deal_value REAL,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Project synergies junction table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS project_synergies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_id INTEGER NOT NULL,
                    synergy_id INTEGER NOT NULL,
                    expected_savings REAL,
                    implementation_status TEXT DEFAULT 'planned',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                    FOREIGN KEY (synergy_id) REFERENCES synergies(id) ON DELETE CASCADE,
                    UNIQUE(project_id, synergy_id)
                )
            """)
            
            conn.commit()
    
    def drop_tables(self):
        """Drop all tables (use with caution!)"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS project_synergies")
            cursor.execute("DROP TABLE IF EXISTS projects")
            cursor.execute("DROP TABLE IF EXISTS synergies")
            conn.commit()
    
    # CRUD Operations for Synergies
    
    def create_synergy(self, synergy_data: Dict[str, Any]) -> int:
        """Create a new synergy record
        
        Args:
            synergy_data: Dictionary containing synergy information
            
        Returns:
            int: ID of created synergy
        """
        required_fields = [
            'function', 'synergy_type', 'description', 
            'implementation_timeline', 'risk_level',
            'potential_savings_min', 'potential_savings_max',
            'industry_applicability'
        ]
        
        for field in required_fields:
            if field not in synergy_data:
                raise ValueError(f"Missing required field: {field}")
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO synergies (
                    function, synergy_type, description,
                    implementation_timeline, risk_level,
                    potential_savings_min, potential_savings_max,
                    industry_applicability
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                synergy_data['function'],
                synergy_data['synergy_type'],
                synergy_data['description'],
                synergy_data['implementation_timeline'],
                synergy_data['risk_level'],
                synergy_data['potential_savings_min'],
                synergy_data['potential_savings_max'],
                synergy_data['industry_applicability']
            ))
            conn.commit()
            return cursor.lastrowid
    
    def get_synergy(self, synergy_id: int) -> Optional[Dict[str, Any]]:
        """Get a single synergy by ID
        
        Args:
            synergy_id: ID of the synergy
            
        Returns:
            Dictionary containing synergy data or None if not found
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM synergies WHERE id = ?
            """, (synergy_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_all_synergies(self, limit: Optional[int] = None, 
                          offset: int = 0) -> List[Dict[str, Any]]:
        """Get all synergies with optional pagination
        
        Args:
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of synergy dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            query = "SELECT * FROM synergies ORDER BY function, synergy_type"
            
            if limit:
                query += f" LIMIT {limit} OFFSET {offset}"
            
            cursor.execute(query)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_synergies_by_function(self, function: str) -> List[Dict[str, Any]]:
        """Get all synergies for a specific function
        
        Args:
            function: Function name (e.g., 'Operations', 'IT')
            
        Returns:
            List of synergy dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM synergies 
                WHERE function = ?
                ORDER BY synergy_type
            """, (function,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_synergies_by_industry(self, industry: str) -> List[Dict[str, Any]]:
        """Get synergies applicable to a specific industry
        
        Args:
            industry: Industry name
            
        Returns:
            List of synergy dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM synergies 
                WHERE industry_applicability LIKE ?
                ORDER BY function, synergy_type
            """, (f'%{industry}%',))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_synergies_by_type(self, synergy_type: str) -> List[Dict[str, Any]]:
        """Get synergies by type (Cost or Revenue)
        
        Args:
            synergy_type: 'Cost' or 'Revenue'
            
        Returns:
            List of synergy dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM synergies 
                WHERE synergy_type = ?
                ORDER BY function
            """, (synergy_type,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_synergies_by_risk(self, risk_level: str) -> List[Dict[str, Any]]:
        """Get synergies by risk level
        
        Args:
            risk_level: 'Low', 'Medium', or 'High'
            
        Returns:
            List of synergy dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM synergies 
                WHERE risk_level = ?
                ORDER BY function, synergy_type
            """, (risk_level,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def update_synergy(self, synergy_id: int, 
                       synergy_data: Dict[str, Any]) -> bool:
        """Update an existing synergy
        
        Args:
            synergy_id: ID of the synergy to update
            synergy_data: Dictionary containing fields to update
            
        Returns:
            bool: True if update was successful
        """
        allowed_fields = [
            'function', 'synergy_type', 'description',
            'implementation_timeline', 'risk_level',
            'potential_savings_min', 'potential_savings_max',
            'industry_applicability'
        ]
        
        # Filter out fields that aren't allowed
        update_fields = {k: v for k, v in synergy_data.items() 
                        if k in allowed_fields}
        
        if not update_fields:
            return False
        
        # Build UPDATE query dynamically
        set_clause = ", ".join([f"{field} = ?" for field in update_fields.keys()])
        values = list(update_fields.values())
        values.append(synergy_id)
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"""
                UPDATE synergies 
                SET {set_clause}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, values)
            conn.commit()
            return cursor.rowcount > 0
    
    def delete_synergy(self, synergy_id: int) -> bool:
        """Delete a synergy
        
        Args:
            synergy_id: ID of the synergy to delete
            
        Returns:
            bool: True if deletion was successful
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM synergies WHERE id = ?", (synergy_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def search_synergies(self, search_term: str) -> List[Dict[str, Any]]:
        """Search synergies by keyword in description
        
        Args:
            search_term: Search keyword
            
        Returns:
            List of matching synergy dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM synergies 
                WHERE description LIKE ? OR function LIKE ?
                ORDER BY function, synergy_type
            """, (f'%{search_term}%', f'%{search_term}%'))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def get_synergies_filtered(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get synergies with multiple filters
        
        Args:
            filters: Dictionary of filter criteria
                    (function, synergy_type, risk_level, industry)
            
        Returns:
            List of synergy dictionaries
        """
        where_clauses = []
        values = []
        
        if filters.get('function'):
            where_clauses.append("function = ?")
            values.append(filters['function'])
        
        if filters.get('synergy_type'):
            where_clauses.append("synergy_type = ?")
            values.append(filters['synergy_type'])
        
        if filters.get('risk_level'):
            where_clauses.append("risk_level = ?")
            values.append(filters['risk_level'])
        
        if filters.get('industry'):
            where_clauses.append("industry_applicability LIKE ?")
            values.append(f"%{filters['industry']}%")
        
        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"""
                SELECT * FROM synergies 
                WHERE {where_sql}
                ORDER BY function, synergy_type
            """, values)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    # Project Management Functions
    
    def create_project(self, project_data: Dict[str, Any]) -> int:
        """Create a new project
        
        Args:
            project_data: Dictionary containing project information
            
        Returns:
            int: ID of created project
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO projects (
                    project_name, target_company, acquirer_company,
                    deal_value, status
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                project_data['project_name'],
                project_data['target_company'],
                project_data['acquirer_company'],
                project_data.get('deal_value'),
                project_data.get('status', 'active')
            ))
            conn.commit()
            return cursor.lastrowid
    
    def get_project(self, project_id: int) -> Optional[Dict[str, Any]]:
        """Get a project by ID
        
        Args:
            project_id: ID of the project
            
        Returns:
            Dictionary containing project data or None
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def get_all_projects(self) -> List[Dict[str, Any]]:
        """Get all projects
        
        Returns:
            List of project dictionaries
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def add_synergy_to_project(self, project_id: int, synergy_id: int,
                               expected_savings: Optional[float] = None,
                               notes: Optional[str] = None) -> int:
        """Add a synergy to a project

        Args:
            project_id: ID of the project
            synergy_id: ID of the synergy
            expected_savings: Expected savings amount
            notes: Additional notes

        Returns:
            int: ID of created project_synergy record
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO project_synergies (
                    project_id, synergy_id, expected_savings, notes
                ) VALUES (?, ?, ?, ?)
            """, (project_id, synergy_id, expected_savings, notes))
            conn.commit()
            return cursor.lastrowid


# Global database instance
_db_instance = None


def get_db(db_path: str = "synergies.db") -> Database:
    """Get or create the global Database instance.

    Args:
        db_path: Path to SQLite database file

    Returns:
        Database instance
    """
    global _db_instance
    if _db_instance is None:
        _db_instance = Database(db_path)
    return _db_instance


def init_db(db_path: str = "synergies.db") -> Database:
    """Initialize and return a Database instance.

    Args:
        db_path: Path to SQLite database file

    Returns:
        Initialized Database instance
    """
    return Database(db_path)