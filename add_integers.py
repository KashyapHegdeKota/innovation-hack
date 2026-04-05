def add_integers(a, b):
    """Add two integers and return the result."""
    return a + b

def main():
    # Example usage
    num1 = 5
    num2 = 3
    result = add_integers(num1, num2)
    print(f"{num1} + {num2} = {result}")
    
    # Interactive input
    try:
        x = int(input("Enter first integer: "))
        y = int(input("Enter second integer: "))
        sum_result = add_integers(x, y)
        print(f"{x} + {y} = {sum_result}")
    except ValueError:
        print("Please enter valid integers.")

if __name__ == "__main__":
    main()