#!/usr/bin/env python3
"""
Test script for the division program
"""

from divide_by_three import divide_by_three_numbers

def test_division():
    """Test the division function"""
    print("Testing division function...")
    
    # Test case 1: Normal division
    result1 = divide_by_three_numbers(120, 2, 3, 4)
    expected1 = 120 / 2 / 3 / 4  # Should be 5.0
    print(f"Test 1: 120 / 2 / 3 / 4 = {result1} (expected: {expected1})")
    assert result1 == expected1, f"Expected {expected1}, got {result1}"
    
    # Test case 2: Decimal numbers
    result2 = divide_by_three_numbers(100.5, 2.5, 2, 1.5)
    expected2 = 100.5 / 2.5 / 2 / 1.5  # Should be 13.4
    print(f"Test 2: 100.5 / 2.5 / 2 / 1.5 = {result2} (expected: {expected2})")
    assert abs(result2 - expected2) < 0.001, f"Expected {expected2}, got {result2}"
    
    # Test case 3: Division by zero should raise error
    try:
        divide_by_three_numbers(10, 2, 0, 3)
        print("Test 3: FAILED - Should have raised ZeroDivisionError")
    except ZeroDivisionError:
        print("Test 3: PASSED - ZeroDivisionError raised correctly")
    
    print("All tests passed!")

if __name__ == "__main__":
    test_division()