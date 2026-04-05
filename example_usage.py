#!/usr/bin/env python3
"""
Example usage of the LLM addition script.
This shows how to use the function programmatically.
"""

from llm_addition import call_llm_for_addition


def demo_without_api():
    """Demonstrate what happens without an API key."""
    print("Demo: Calling LLM addition without API key")
    print("-" * 45)
    
    result = call_llm_for_addition(5, 3)
    
    if result.get("error"):
        print(f"Expected error: {result['error']}")
    else:
        print("Unexpected success!")


def demo_with_fake_api():
    """Demonstrate with a fake API key (will fail but show the flow)."""
    print("\nDemo: Calling LLM addition with fake API key")
    print("-" * 48)
    
    result = call_llm_for_addition(10, 20, api_key="fake-key-for-demo")
    
    if result.get("error"):
        print(f"Expected API error: {result['error']}")
    else:
        print("Unexpected success!")


def show_usage_instructions():
    """Show how to use the script properly."""
    print("\nTo use this script with a real API key:")
    print("-" * 40)
    print("1. Get an OpenAI API key from https://platform.openai.com/api-keys")
    print("2. Set it as an environment variable:")
    print("   export OPENAI_API_KEY='your-actual-api-key-here'")
    print("3. Run the main script:")
    print("   python llm_addition.py")
    print("\nOr use it programmatically:")
    print("   from llm_addition import call_llm_for_addition")
    print("   result = call_llm_for_addition(5, 3, api_key='your-key')")


if __name__ == "__main__":
    demo_without_api()
    demo_with_fake_api()
    show_usage_instructions()