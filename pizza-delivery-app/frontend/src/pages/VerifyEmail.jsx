import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/axios.js';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setMessage(data.message);
        setStatus('success');
      } catch (err) {
        setMessage(err.response?.data?.message || 'Verification failed');
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Email Verification</h2>
        {status === 'verifying' && <p>Verifying your email...</p>}
        {status !== 'verifying' && (
          <div className={`alert ${status === 'success' ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}
        {status === 'success' && (
          <p>
            <Link to="/login">Go to login</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
