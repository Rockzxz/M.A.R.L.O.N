from django.db import models
from django.contrib.auth.models import User  # Recommended for handling borrowers
from datetime import date  # Required for date comparisons

# Define Book model (representing the physical or digital items)
class Book(models.Model):
    # Defines the available statuses for a book
    STATUS_CHOICES = [
        ('A', 'Available'),
        ('B', 'Borrowed'),
        ('M', 'Maintenance'),
    ]

    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    
    # Availability status, defaulting to Available ('A')
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, default='A')
    
    # Adding an ISBN for unique identification (helpful for robustness)
    isbn = models.CharField(max_length=13, unique=True, help_text='13-character ISBN number', null=True, blank=True)

    def __str__(self):
        return f"{self.title} by {self.author}"

# Define BorrowRecord model (representing the transactional borrowing event)
class BorrowRecord(models.Model):
    # Links to the User who borrowed the book
    # using related_name allows easy access: user.borrow_records.all()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='borrow_records')
    
    # Links to the specific Book that was borrowed
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrow_records')
    
    # Transactions dates
    # Set automatically on record creation
    borrow_date = models.DateField(default=date.today)
    
    # Must be set manually during the borrowing action
    due_date = models.DateField()
    
    # Initially empty (null), set when the book is returned
    return_date = models.DateField(null=True, blank=True)

    def __str__(self):
        # Provides a clear string representation of the record
        status = "Returned" if self.return_date else "Not Returned"
        return f"{self.user.username} borrowed '{self.book.title}' ({status})"

    # Critical calculation for "Compute overdue days" task in image_0.png
    @property
    def overdue_days(self):
        """
        Calculates the number of days a book is overdue as a model property.
        We do NOT store this in the database to avoid redundant data
        and potential inconsistencies.
        """
        if self.return_date:
            # Check if returned late
            if self.return_date > self.due_date:
                delta = self.return_date - self.due_date
                return max(0, delta.days)  # Return non-negative days
            else:
                return 0
        else:
            # Check if not returned and past due
            today = date.today()
            if today > self.due_date:
                delta = today - self.due_date
                return max(0, delta.days)
            else:
                return 0