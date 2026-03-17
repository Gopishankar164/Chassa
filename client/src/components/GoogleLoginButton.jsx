import { GoogleLogin } from '@react-oauth/google';
import API_BASE_URL from '../config/api';

export default function GoogleLoginButton({ onAuth }) {
    const handleSuccess = async (credentialResponse) => {
        try {
            const { credential } = credentialResponse;
            const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential }),
            });
            if (!res.ok) throw new Error('Server error');
            const data = await res.json();
            if (data?.token && data?.user) {
                onAuth?.(data.user, data.token);
            } else {
                alert('Google Sign-In failed: invalid server response');
            }
        } catch {
            alert('Google Sign-In failed. Please try again.');
        }
    };

    const handleError = () => {
        alert('Google Sign-In could not be initialised.');
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            shape="rectangular"
            theme="outline"
            size="large"
            text="continue_with"
            width="100%"
        />
    );
}
