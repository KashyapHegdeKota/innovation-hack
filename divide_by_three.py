#!/usr/bin/env python3
"""
Program to divide a number by three other numbers
"""

def divide_by_three_numbers(dividend, divisor1, divisor2, divisor3):
    """
    Divides a number by three other numbers sequentially.
    
    Args:
        dividend (float): The number to be divided
        divisor1 (float): First divisor
        divisor2 (float): Second divisor  
        divisor3 (float): Third divisor
    
    Returns:
        float: The result of dividend / divisor1 / divisor2 / divisor3
    
    Raises:
        ZeroDivisionError: If any divisor is zero
    """
    if divisor1 == 0 or divisor2 == 0 or divisor3 == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    
    result = dividend / divisor1 / divisor2 / divisor3
    return result

def main():
    """Main function to get user input and perform division"""
    try:
        print("Division Calculator - Divide a number by three other numbers")
        print("-" * 55)
        
        # Get input from user
        dividend = float(input("Enter the number to be divided: "))
        divisor1 = float(input("Enter the first divisor: "))
        divisor2 = float(input("Enter the second divisor: "))
        divisor3 = float(input("Enter the third divisor: "))
        
        # Perform the division
        result = divide_by_three_numbers(dividend, divisor1, divisor2, divisor3)
        
        # Display the result
        print(f"\nCalculation: {dividend} / {divisor1} / {divisor2} / {divisor3}")
        print(f"Result: {result}")
        
        # Show step by step calculation
        step1 = dividend / divisor1
        step2 = step1 / divisor2
        step3 = step2 / divisor3
        
        print(f"\nStep-by-step:")
        print(f"Step 1: {dividend} / {divisor1} = {step1}")
        print(f"Step 2: {step1} / {divisor2} = {step2}")
        print(f"Step 3: {step2} / {divisor3} = {step3}")
        
    except ValueError:
        print("Error: Please enter valid numbers only.")
    except ZeroDivisionError as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()