import numpy as np

class SimpleNeuralNetwork:
    """
    A simple 3-layer neural network for binary classification
    Architecture: Input -> Hidden -> Output
    """
    
    def __init__(self, input_neurons=2, hidden_neurons=4, output_neurons=1):
        """Initialize the neural network with random weights"""
        # Set random seed for reproducible results
        np.random.seed(42)
        
        # Initialize weights between -1 and 1 with mean 0
        self.weights_input_hidden = 2 * np.random.random((input_neurons, hidden_neurons)) - 1
        self.weights_hidden_output = 2 * np.random.random((hidden_neurons, output_neurons)) - 1
        
        print(f"Neural Network initialized:")
        print(f"Input layer: {input_neurons} neurons")
        print(f"Hidden layer: {hidden_neurons} neurons") 
        print(f"Output layer: {output_neurons} neurons")
    
    def sigmoid(self, x):
        """Sigmoid activation function"""
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    def sigmoid_derivative(self, x):
        """Derivative of sigmoid function"""
        return x * (1 - x)
    
    def feedforward(self, inputs):
        """Forward pass through the network"""
        # Calculate hidden layer
        self.hidden_input = np.dot(inputs, self.weights_input_hidden)
        self.hidden_output = self.sigmoid(self.hidden_input)
        
        # Calculate output layer
        self.final_input = np.dot(self.hidden_output, self.weights_hidden_output)
        self.final_output = self.sigmoid(self.final_input)
        
        return self.final_output
    
    def backpropagation(self, inputs, targets, learning_rate=0.1):
        """Backward pass to update weights"""
        # Calculate output layer error
        output_error = targets - self.final_output
        output_delta = output_error * self.sigmoid_derivative(self.final_output)
        
        # Calculate hidden layer error
        hidden_error = output_delta.dot(self.weights_hidden_output.T)
        hidden_delta = hidden_error * self.sigmoid_derivative(self.hidden_output)
        
        # Update weights
        self.weights_hidden_output += self.hidden_output.T.dot(output_delta) * learning_rate
        self.weights_input_hidden += inputs.T.dot(hidden_delta) * learning_rate
    
    def train(self, training_inputs, training_outputs, epochs=10000, learning_rate=0.1):
        """Train the neural network"""
        print(f"\nTraining for {epochs} epochs...")
        
        for epoch in range(epochs):
            # Forward pass
            self.feedforward(training_inputs)
            
            # Backward pass
            self.backpropagation(training_inputs, training_outputs, learning_rate)
            
            # Print progress every 1000 epochs
            if epoch % 1000 == 0:
                loss = np.mean(np.square(training_outputs - self.final_output))
                print(f"Epoch {epoch}: Loss = {loss:.6f}")
    
    def predict(self, inputs):
        """Make predictions on new data"""
        return self.feedforward(inputs)

# Example usage and testing
if __name__ == "__main__":
    print("Simple Neural Network Demo")
    print("="*40)
    
    # Create training data for XOR problem
    # XOR is not linearly separable, so it's a good test for neural networks
    training_inputs = np.array([[0, 0],
                               [0, 1],
                               [1, 0],
                               [1, 1]])
    
    training_outputs = np.array([[0],  # 0 XOR 0 = 0
                                [1],  # 0 XOR 1 = 1
                                [1],  # 1 XOR 0 = 1
                                [0]]) # 1 XOR 1 = 0
    
    print("Training Data (XOR Problem):")
    print("Inputs:", training_inputs.tolist())
    print("Expected Outputs:", training_outputs.flatten().tolist())
    
    # Create and train neural network
    nn = SimpleNeuralNetwork(input_neurons=2, hidden_neurons=4, output_neurons=1)
    nn.train(training_inputs, training_outputs, epochs=10000, learning_rate=1.0)
    
    print("\nTraining completed!")
    print("\nTesting the trained network:")
    print("="*30)
    
    # Test the network
    for i, input_data in enumerate(training_inputs):
        prediction = nn.predict(input_data.reshape(1, -1))
        expected = training_outputs[i][0]
        print(f"Input: {input_data} -> Prediction: {prediction[0][0]:.4f}, Expected: {expected}")
    
    print(f"\nFinal weights (Input to Hidden):")
    print(nn.weights_input_hidden)
    print(f"\nFinal weights (Hidden to Output):")
    print(nn.weights_hidden_output)