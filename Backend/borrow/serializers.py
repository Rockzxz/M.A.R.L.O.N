from rest_framework import serializers
from .models import Book, Borrowing, History

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Book title cannot be blank.")
        return value

class BorrowingSerializer(serializers.ModelSerializer):
    
    overdue_days = serializers.ReadOnlyField()
    
 
    book_details = BookSerializer(source='book', read_only=True)

    class Meta:
        model = Borrowing
        fields = '__all__'

class HistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = '__all__'