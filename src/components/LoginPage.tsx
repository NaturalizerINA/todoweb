import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';

interface LoginPageProps {
  onLogin: (email: string) => void;
  apiUrl: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, apiUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Invalid credentials' }));
        throw new Error(data.message || 'Login failed');
      }

      // Success
      await res.json();
      onLogin(email);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Card style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--board-bg)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }} className="shadow-lg p-3">
        <Card.Body>
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--primary)', color: 'white' }}>
              <i className="bi bi-kanban" style={{ fontSize: '1.8rem' }}></i>
            </div>
            <h2 className="fw-bold" style={{ color: 'var(--text-main)' }}>{isRegistering ? 'Join Us' : 'Welcome Back'}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{isRegistering ? 'Create an account to manage your tasks' : 'Log in to access your Kanban board'}</p>
          </div>

          {error && <Alert variant="danger" className="text-center py-2" style={{ fontSize: '0.85rem' }}>{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label className="form-label">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="Enter email" 
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formBasicPassword">
              <Form.Label className="form-label">Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Password" 
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 btn-primary-custom py-2 mt-2" 
              disabled={loading}
              style={{ fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Processing...
                </>
              ) : (isRegistering ? 'Sign Up' : 'Sign In')}
            </Button>
          </Form>

          <div className="text-center mt-4 pt-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}
              <Button 
                variant="link" 
                className="ms-1 p-0" 
                style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering ? 'Sign In' : 'Create Account'}
              </Button>
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;
