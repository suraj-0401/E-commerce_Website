const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const bodyParser = require('body-parser');

const stripe = Stripe('sk_test_51PlmgsCRaWWPfJ2zzdcdMdpJN7Y82uQKk1xmj1rg1wezWncfOGuGOUtWiV9IHtAfiTqMRP6oik0frzOk35Mad388008Pe59TwF'); // Replace with your secret key

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Payment route
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { product } = req.body;

        if (!product || product.length === 0) {
            return res.status(400).json({ message: 'Product data is required' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: product.map((p) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: p.title,
                    },
                    unit_amount: p.price * 100, // Convert price to cents
                },
                quantity: 1,
            })),
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        res.status(500).send('Server Error');
    }
});

// Start the server
const PORT = 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
