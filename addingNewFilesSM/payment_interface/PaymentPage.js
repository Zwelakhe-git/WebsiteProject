// PaymentPage компонент - основная страница оплаты
const PaymentPage = () => {
    const [cardNumber, setCardNumber] = React.useState('');
    const [cardName, setCardName] = React.useState('');
    const [expiry, setExpiry] = React.useState('');
    const [cvv, setCvv] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [activeMethod, setActiveMethod] = React.useState('card');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Payment processed successfully!');
        // Here would be the actual payment processing logic
    };
    
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];
        
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        
        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };
    
    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setCardNumber(formatted);
    };
    
    return (
        <div className="payment-container">
            <div className="header">
                <h1>Secure Online Payments</h1>
                <p>Fast and secure payment processing for your purchases</p>
            </div>
            
            <div className="payment-content">
                <div className="payment-form">
                    <h2 className="section-title">Payment Method</h2>
                    
                    <div className="payment-methods">
                        <div 
                            className={`payment-method ${activeMethod === 'card' ? 'active' : ''}`}
                            onClick={() => setActiveMethod('card')}
                        >
                            <span className="icon">💳</span>
                            <span className="name">Credit Card</span>
                        </div>
                        <div 
                            className={`payment-method ${activeMethod === 'paypal' ? 'active' : ''}`}
                            onClick={() => setActiveMethod('paypal')}
                        >
                            <span className="icon">📱</span>
                            <span className="name">PayPal</span>
                        </div>
                        <div 
                            className={`payment-method ${activeMethod === 'moncash' ? 'active' : ''}`}
                            onClick={() => setActiveMethod('moncash')}
                        >
                            <span className="icon">💸</span>
                            <span className="name"><span className="moncash-logo">Mon Cash</span></span>
                        </div>
                        <div 
                            className={`payment-method ${activeMethod === 'applepay' ? 'active' : ''}`}
                            onClick={() => setActiveMethod('applepay')}
                        >
                            <span className="icon">🍎</span>
                            <span className="name">Apple Pay</span>
                        </div>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        {activeMethod === 'card' && (
                            <>
                                <div className="form-group">
                                    <label>Card Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        maxLength="19"
                                        required
                                    />
                                    <div className="card-icons">
                                        <div className="card-icon">VISA</div>
                                        <div className="card-icon">MC</div>
                                        <div className="card-icon">AMEX</div>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Cardholder Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="JOHN DOE"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Expiry Date</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="MM/YY"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            maxLength="5"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label>CVV Code</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="123"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            maxLength="3"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {activeMethod === 'paypal' && (
                            <div className="form-group">
                                <p>After clicking "Pay Now", you will be redirected to PayPal to complete your payment securely.</p>
                            </div>
                        )}
                        
                        {activeMethod === 'moncash' && (
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    placeholder="Your Mon Cash phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                                <p style={{marginTop: '10px', fontSize: '14px', color: '#666'}}>
                                    Enter your Mon Cash registered phone number. You will receive a confirmation prompt on your device.
                                </p>
                            </div>
                        )}
                        
                        {activeMethod === 'applepay' && (
                            <div className="form-group">
                                <p>After clicking "Pay Now", the Apple Pay window will open to complete your payment.</p>
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label>Email for receipt</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn">Pay Now</button>
                        
                        <div className="secure-notice">
                            🔒 Your data is securely protected
                        </div>
                    </form>
                </div>
                
                <div className="payment-summary">
                    <h2 className="section-title">Order Summary</h2>
                    
                    <div className="summary-item">
                        <span>Products</span>
                        <span>$98.00</span>
                    </div>
                    
                    <div className="summary-item">
                        <span>Shipping</span>
                        <span>$12.00</span>
                    </div>
                    
                    <div className="summary-item">
                        <span>Tax</span>
                        <span>$9.80</span>
                    </div>
                    
                    <div className="summary-total">
                        <span>Total</span>
                        <span>$119.80</span>
                    </div>
                    
                    <div className="info-box">
                        <h3>Money-Back Guarantee</h3>
                        <p>If you're not satisfied with your purchase, we offer a 30-day money-back guarantee with no questions asked.</p>
                    </div>
                    
                    <div className="info-box">
                        <h3>Customer Support</h3>
                        <p>Phone: +1 (800) 123-4567</p>
                        <p>Email: support@example.com</p>
                        <p>Hours: Mon-Fri, 9am-6pm EST</p>
                    </div>
                </div>
            </div>
        </div>
    );
};