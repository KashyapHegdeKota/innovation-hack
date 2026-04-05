#!/usr/bin/env python3
"""
Script that calls an LLM to add two integers.
This example uses OpenAI's API, but can be adapted for other LLM providers.
"""

import os
import json
from typing import Optional

# Using requests for simplicity - in production, consider using official SDK
try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    exit(1)


def call_llm_for_addition(num1: int, num2: int, api_key: Optional[str] = None) -> dict:
    """
    Call an LLM to add two integers.
    
    Args:
        num1: First integer
        num2: Second integer
        api_key: OpenAI API key (optional, will try to get from environment)
    
    Returns:
        Dictionary with result and metadata
    """
    
    # Get API key from parameter or environment
    if not api_key:
        api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        return {
            "error": "No API key provided. Set OPENAI_API_KEY environment variable or pass as parameter.",
            "result": None
        }
    
    # Prepare the prompt
    prompt = f"""Please add these two integers and return only the numerical result:
{num1} + {num2} = 

Return only the number, nothing else."""

    # API request payload
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": 10,
        "temperature": 0  # Make it deterministic for math
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Make the API call
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        response.raise_for_status()
        
        # Parse response
        response_data = response.json()
        llm_result = response_data['choices'][0]['message']['content'].strip()
        
        # Try to parse the result as an integer
        try:
            parsed_result = int(llm_result)
            actual_result = num1 + num2
            
            return {
                "num1": num1,
                "num2": num2,
                "llm_result": parsed_result,
                "actual_result": actual_result,
                "correct": parsed_result == actual_result,
                "raw_response": llm_result,
                "error": None
            }
        except ValueError:
            return {
                "num1": num1,
                "num2": num2,
                "llm_result": None,
                "actual_result": num1 + num2,
                "correct": False,
                "raw_response": llm_result,
                "error": f"Could not parse LLM response as integer: '{llm_result}'"
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "error": f"API request failed: {str(e)}",
            "result": None
        }
    except Exception as e:
        return {
            "error": f"Unexpected error: {str(e)}",
            "result": None
        }


def main():
    """Main function to demonstrate the LLM addition."""
    
    print("LLM Integer Addition Demo")
    print("=" * 30)
    
    # Test cases
    test_cases = [
        (5, 3),
        (42, 17),
        (-10, 25),
        (0, 100),
        (999, 1)
    ]
    
    # Check if API key is available
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("WARNING: No OPENAI_API_KEY found in environment variables.")
        print("Please set your OpenAI API key to run this script:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        print("\nOr you can call the function directly with api_key parameter:")
        print("result = call_llm_for_addition(5, 3, api_key='your-key')")
        return
    
    print("Running test cases...\n")
    
    for i, (num1, num2) in enumerate(test_cases, 1):
        print(f"Test {i}: {num1} + {num2}")
        
        result = call_llm_for_addition(num1, num2)
        
        if result.get("error"):
            print(f"ERROR: {result['error']}")
        else:
            llm_answer = result['llm_result']
            actual_answer = result['actual_result']
            is_correct = result['correct']
            
            status = "CORRECT" if is_correct else "WRONG"
            print(f"[{status}] LLM says: {llm_answer}, Actual: {actual_answer}")
            
            if not is_correct:
                print(f"   Raw response: '{result['raw_response']}'")
        
        print()


if __name__ == "__main__":
    main()