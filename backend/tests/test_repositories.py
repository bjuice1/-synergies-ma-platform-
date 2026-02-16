"""
Unit tests for repository layer.
Tests CRUD operations, error handling, and edge cases.
"""
import pytest
from backend.repositories import ItemRepository
from backend.app.models import Item

class TestItemRepository:
    """Test cases for ItemRepository."""

    @pytest.fixture
    def repo(self, db_session):
        """Create an ItemRepository instance."""
        return ItemRepository(db_session)

    def test_get_all_empty(self, repo):
        """Test get_all with no items in database."""
        items = repo.get_all()
        assert items == []

    def test_get_all_with_items(self, repo, sample_items):
        """Test get_all returns all items."""
        items = repo.get_all()
        assert len(items) == 3
        assert all((isinstance(item, Item) for item in items))

    def test_get_by_id_existing(self, repo, sample_item):
        """Test get_by_id with existing item."""
        item = repo.get_by_id(sample_item.id)
        assert item is not None
        assert item.id == sample_item.id
        assert item.name == sample_item.name

    def test_get_by_id_nonexistent(self, repo):
        """Test get_by_id with non-existent ID."""
        item = repo.get_by_id(99999)
        assert item is None

    def test_get_by_id_invalid(self, repo):
        """Test get_by_id with invalid ID."""
        item = repo.get_by_id(None)
        assert item is None

    def test_create_item(self, repo):
        """Test creating a new item."""
        data = {'name': 'Created Item', 'description': 'Created via repository', 'quantity': 50, 'price': 75.0}
        item = repo.create(data)
        assert item.id is not None
        assert item.name == data['name']
        assert item.description == data['description']
        assert item.quantity == data['quantity']
        assert item.price == data['price']

    def test_create_item_minimal(self, repo):
        """Test creating item with minimal data."""
        data = {'name': 'Minimal'}
        item = repo.create(data)
        assert item.id is not None
        assert item.name == 'Minimal'
        assert item.quantity == 0
        assert item.price == 0.0

    def test_create_item_invalid(self, repo):
        """Test creating item with invalid data."""
        with pytest.raises(Exception):
            repo.create({})

    def test_update_item(self, repo, sample_item):
        """Test updating an existing item."""
        update_data = {'name': 'Updated Name', 'quantity': 999}
        updated_item = repo.update(sample_item.id, update_data)
        assert updated_item.name == 'Updated Name'
        assert updated_item.quantity == 999
        assert updated_item.description == sample_item.description

    def test_update_item_nonexistent(self, repo):
        """Test updating non-existent item."""
        result = repo.update(99999, {'name': 'Ghost'})
        assert result is None

    def test_update_item_partial(self, repo, sample_item):
        """Test partial update of item."""
        original_name = sample_item.name
        updated_item = repo.update(sample_item.id, {'quantity': 5})
        assert updated_item.name == original_name
        assert updated_item.quantity == 5

    def test_delete_item(self, repo, sample_item):
        """Test deleting an item."""
        item_id = sample_item.id
        result = repo.delete(item_id)
        assert result is True
        assert repo.get_by_id(item_id) is None

    def test_delete_item_nonexistent(self, repo):
        """Test deleting non-existent item."""
        result = repo.delete(99999)
        assert result is False

    def test_search_by_name(self, repo, sample_items):
        """Test searching items by name."""
        results = repo.search(name='Item 1')
        assert len(results) == 1
        assert results[0].name == 'Item 1'

    def test_filter_by_quantity(self, repo, sample_items):
        """Test filtering items by quantity."""
        results = repo.filter(min_quantity=10)
        assert len(results) == 1
        assert results[0].quantity >= 10