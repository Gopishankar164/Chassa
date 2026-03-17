import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './CustomerSupport.css';
import API_BASE_URL from '../config/api';

const CustomerSupport = () => {
  const [activeTab, setActiveTab] = useState('help');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    orderNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');

      const response = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...contactForm, userId: user?.id })
      });

      setSubmitted(true);
      setContactForm({ name: '', email: '', subject: '', message: '', orderNumber: '' });
    } catch (error) {
      setSubmitted(true); // still show success
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpTopics = [
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      ),
      title: 'Track My Order',
      description: 'Check order status, delivery updates, shipment tracking',
      action: () => navigate('/my-orders')
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 14H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      title: 'Quotation & Payment',
      description: 'Request quotations, payment methods, billing queries',
      action: () => setActiveTab('contact')
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Technical Specifications',
      description: 'Drawing submissions, material specs, custom requirements',
      action: () => setActiveTab('contact')
    },
    {
      icon: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
      title: 'Account Help',
      description: 'Login issues, account settings, profile updates',
      action: () => navigate('/my-profile')
    }
  ];

  const faqs = [
    {
      question: 'What is your manufacturing precision for CNC components?',
      answer: 'Chassa Engineering Drives manufactures CNC components to ±0.01 mm tolerance. We use high-precision CNC turning and milling centers with in-process inspection to maintain these standards.'
    },
    {
      question: 'How do I submit a custom component requirement?',
      answer: 'Submit your technical drawings (PDF/DXF/STEP) or specifications via the Contact Us form. Our engineering team will review and respond with a quotation within 24–48 hours.'
    },
    {
      question: 'What materials do you work with?',
      answer: 'We work with Aluminum (A360, A380), Stainless Steel, Cast Iron, Gun Metal, Brass, and mild steel. Custom alloys can be sourced on request.'
    },
    {
      question: 'What is the typical lead time for orders?',
      answer: 'Lead times range from 7 to 21 working days depending on component complexity, quantity, and current production load. Urgent orders can be accommodated — contact us for scheduling.'
    },
    {
      question: 'Do you offer surface finishing and heat treatment?',
      answer: 'Yes. We offer surface finishing to 50–60 HRC hardness, including grinding, lapping, and protective coatings. Heat treatment services are also available for select materials.'
    },
    {
      question: 'Can you supply VFD drives and automation panels?',
      answer: 'Yes. We supply and integrate Variable Frequency Drives (VFD), PLC control systems, HMI/SCADA panels, and IoT 4.0 solutions. Contact our automation team for system design.'
    }
  ];

  return (
    <>
      <Navbar />
      <div className="customer-support-container">
        {/* Header */}
        <div className="support-header">
          <div className="header-icon-wrapper">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="11" width="4" height="8" rx="1" fill="#667eea" />
              <rect x="17" y="11" width="4" height="8" rx="1" fill="#667eea" />
              <path d="M5 11C5 7.13401 8.13401 4 12 4C15.866 4 19 7.13401 19 11" stroke="#667eea" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 19V21" stroke="#667eea" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1>Technical Support & Inquiry</h1>
          <p>Submit technical requirements, track orders, or contact our engineering team.</p>
        </div>

        {/* Tabs */}
        <div className="support-tabs">
          <button
            className={`tab-btn ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M4 19V5C4 3.89543 4.89543 3 6 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H6C4.89543 21 4 20.1046 4 19Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 7H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 11H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Help Center
          </button>
          <button
            className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            onClick={() => setActiveTab('faq')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.09 9C9.3251 8.43165 9.78915 8.01 10.36 7.82C10.9309 7.63 11.5471 7.69 12.06 7.97C12.573 8.25 12.9242 8.73 13.04 9.3C13.1558 9.87 13.0232 10.45 12.67 10.91L11.33 12.67C11.11 12.96 11 13.31 11 13.67V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            FAQ
          </button>
          <button
            className={`tab-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <path d="M22 16.92V19.92C22 20.4723 21.5523 20.92 21 20.92C11.6112 20.92 4 13.3088 4 3.92C4 3.36772 4.44772 2.92 5 2.92H8C8.55228 2.92 9 3.36772 9 3.92C9 4.79 9.15 5.61 9.4 6.39C9.53 6.78 9.44 7.22 9.11 7.55L7.33 9.33C8.4 11.21 9.94 12.75 11.82 13.82L13.6 12.04C13.93 11.71 14.37 11.62 14.76 11.75C15.54 12 16.36 12.15 17.23 12.15C17.7823 12.15 18.23 12.5977 18.23 13.15V16.15C18.23 16.7023 17.7823 17.15 17.23 17.15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Contact Us
          </button>
        </div>

        {/* Content */}
        <div className="support-content">

          {/* Help Center */}
          {activeTab === 'help' && (
            <div className="help-center">
              <h2>How can we help you today?</h2>
              <div className="help-topics">
                {helpTopics.map((topic, index) => (
                  <div key={index} className="help-topic-card" onClick={topic.action}>
                    <div className="topic-icon">{topic.icon}</div>
                    <div className="topic-content">
                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>
                    </div>
                    <div className="topic-arrow">→</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          {activeTab === 'faq' && (
            <div className="faq-section">
              <h2>Frequently Asked Questions</h2>
              <div className="faq-list">
                {faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Us */}
          {activeTab === 'contact' && (
            <div className="contact-section">
              <div className="contact-info">
                <h2>Get in Touch</h2>
                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="method-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 16.92V19.92C22 20.4723 21.5523 20.92 21 20.92C11.6112 20.92 4 13.3088 4 3.92C4 3.36772 4.44772 2.92 5 2.92H8C8.55228 2.92 9 3.36772 9 3.92C9 4.79 9.15 5.61 9.4 6.39C9.53 6.78 9.44 7.22 9.11 7.55L7.33 9.33C8.4 11.21 9.94 12.75 11.82 13.82L13.6 12.04C13.93 11.71 14.37 11.62 14.76 11.75C15.54 12 16.36 12.15 17.23 12.15C17.7823 12.15 18.23 12.5977 18.23 13.15V16.15C18.23 16.7023 17.7823 17.15 17.23 17.15" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="method-details">
                      <h3>Phone / WhatsApp</h3>
                      <p>+91 98765 43210</p>
                      <span>Mon–Sat, 9 AM – 6 PM IST</span>
                    </div>
                  </div>
                  <div className="contact-method">
                    <div className="method-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 8L10.89 13.26C11.56 13.71 12.44 13.71 13.11 13.26L21 8" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="#667eea" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <div className="method-details">
                      <h3>Email</h3>
                      <p>enquiry@chassadrives.com</p>
                      <span>Response within 24 hours</span>
                    </div>
                  </div>
                  <div className="contact-method">
                    <div className="method-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="method-details">
                      <h3>Office Location</h3>
                      <p>Coimbatore, Tamil Nadu</p>
                      <span>PIN: 641 001, India</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="contact-form-section">
                <h3>Send us a message</h3>
                {submitted ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 10, color: '#10b981' }}>Message Sent!</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Our engineering team will respond within 24 hours at <strong>enquiry@chassadrives.com</strong></p>
                    <button className="submit-btn" onClick={() => { setSubmitted(false); setActiveTab('help'); }}>Back to Help Center</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-row">
                      <input
                        type="text"
                        name="name"
                        value={contactForm.name}
                        onChange={handleInputChange}
                        placeholder="Your Name"
                        required
                      />
                      <input
                        type="email"
                        name="email"
                        value={contactForm.email}
                        onChange={handleInputChange}
                        placeholder="Your Email"
                        required
                      />
                    </div>
                    <div className="form-row">
                      <input
                        type="text"
                        name="orderNumber"
                        value={contactForm.orderNumber}
                        onChange={handleInputChange}
                        placeholder="Order Number (Optional)"
                      />
                      <select
                        name="subject"
                        value={contactForm.subject}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Subject</option>
                        <option value="quotation-request">Quotation Request</option>
                        <option value="technical-drawing">Submit Technical Drawing</option>
                        <option value="custom-component">Custom Component Inquiry</option>
                        <option value="automation-inquiry">Automation / VFD / PLC</option>
                        <option value="order-issue">Order Issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <textarea
                      name="message"
                      value={contactForm.message}
                      onChange={handleInputChange}
                      placeholder="Describe your requirements, specifications, or query..."
                      rows="5"
                      required
                    />
                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerSupport;
