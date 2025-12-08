import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const InvitationAccept = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }
    
    // Fetch invitation details
    fetchInvitationDetails(token);
  }, [searchParams]);

  const fetchInvitationDetails = async (token) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/auth/invitation/${token}`);
      setInvitation(response.data.invitation);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    const token = searchParams.get('token');
    navigate(`/invitation/register?token=${token}`);
  };

  const handleReject = async () => {
    try {
      const token = searchParams.get('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/invitation/reject`, { token });
      alert('Invitation rejected successfully');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-center">{error}</div>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AC';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md max-w-2xl w-full p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-semibold">
              {getInitials(invitation?.organizationName)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invitation?.organizationName}</h1>
              <p className="text-gray-600">
                Invited by {invitation?.inviterName}{' '}
                <a href={`mailto:${invitation?.inviterEmail}`} className="text-blue-600">
                  ({invitation?.inviterEmail})
                </a>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Desk</span>
          </div>
        </div>

        <hr className="my-6 border-gray-200" />

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Our Organization</h2>
          <p className="text-gray-700">
            We invite you to join our organization. Create a Zoho account for the email address{' '}
            <span className="font-semibold">{invitation?.recipientEmail}</span> to accept the invitation.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAccept}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Sign up & Accept
          </button>
          <button
            onClick={handleReject}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Reject
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          Please contact{' '}
          <a href={`mailto:${invitation?.inviterEmail}`} className="text-blue-600">
            {invitation?.inviterEmail}
          </a>{' '}
          for any queries.
        </div>
      </div>
    </div>
  );
};

export default InvitationAccept;
