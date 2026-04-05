# Neural Network Implementation

This project contains two Python implementations of neural networks from scratch using NumPy.

## Files

1. **simple_neural_network.py** - A basic 3-layer neural network for educational purposes
2. **neural_network.py** - A more advanced implementation with visualization capabilities
3. **requirements.txt** - Required Python packages

## Features

### Simple Neural Network
- 3-layer architecture (Input -> Hidden -> Output)
- Sigmoid activation function
- Backpropagation learning algorithm
- Demonstrates XOR problem solving
- Educational comments and clear structure

### Advanced Neural Network
- Configurable architecture
- Forward and backward propagation
- Training loss visualization
- Decision boundary plotting (for 2D data)
- Support for classification problems
- Data preprocessing integration

## Installation

1. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

### Run Simple Neural Network (XOR Problem)
```bash
python simple_neural_network.py
```

This will:
- Train a neural network to solve the XOR problem
- Display training progress
- Test the trained network
- Show final weights

### Run Advanced Neural Network
```bash
python neural_network.py
```

This will:
- Generate a 2D classification dataset
- Train a neural network
- Display training accuracy and test accuracy
- Plot training loss over time
- Visualize decision boundaries

## How It Works

### Neural Network Basics
1. **Forward Pass**: Data flows from input -> hidden -> output layers
2. **Activation Function**: Sigmoid function introduces non-linearity
3. **Loss Calculation**: Mean squared error measures prediction accuracy
4. **Backward Pass**: Gradients computed using chain rule
5. **Weight Updates**: Weights adjusted to minimize loss

### XOR Problem
The XOR (exclusive or) problem is a classic test for neural networks because:
- It's not linearly separable
- Requires at least one hidden layer to solve
- Demonstrates the power of multi-layer networks

Truth table:
```
Input A | Input B | Output
--------|---------|-------
   0    |    0    |   0
   0    |    1    |   1
   1    |    0    |   1
   1    |    1    |   0
```

## Key Concepts

### Activation Functions
- **Sigmoid**: f(x) = 1/(1 + e^(-x))
- Maps any real number to (0,1)
- Smooth and differentiable

### Backpropagation
- Calculates gradients layer by layer (backwards)
- Uses chain rule of calculus
- Enables efficient training of deep networks

### Learning Rate
- Controls how much weights change each iteration
- Too high: unstable training
- Too low: slow convergence

## Architecture

```
Simple Neural Network:
Input Layer (2) -> Hidden Layer (4) -> Output Layer (1)

Advanced Neural Network:
Input Layer (n) -> Hidden Layer (m) -> Output Layer (k)
```

## Customization

You can modify the networks by changing:
- Number of hidden neurons
- Learning rate
- Number of training epochs
- Activation functions
- Loss functions

Example:
```python
# Create custom neural network
nn = SimpleNeuralNetwork(input_neurons=3, hidden_neurons=8, output_neurons=2)
```

## Mathematical Foundation

### Forward Pass
```
Hidden = sigmoid(Input * W1)
Output = sigmoid(Hidden * W2)
```

### Backward Pass
```
dLoss/dW2 = Hidden^T * delta_output
dLoss/dW1 = Input^T * delta_hidden
```

Where delta represents the error gradients.

## Performance

The networks achieve:
- **XOR Problem**: ~99% accuracy after 10,000 epochs
- **2D Classification**: ~90%+ accuracy on test data

## Learning Resources

- Neural Networks Explained (YouTube)
- Backpropagation Calculus (YouTube)  
- Deep Learning Book (online)

## Next Steps

To extend these implementations:
1. Add more activation functions (ReLU, Tanh)
2. Implement different loss functions
3. Add regularization (L1, L2)
4. Support for multiple hidden layers
5. Batch processing
6. GPU acceleration with CuPy