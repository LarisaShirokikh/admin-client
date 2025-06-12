// src/components/debug/TokenDebug.tsx
'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface JWTPayload {
    sub?: string;
    exp?: number;
    iat?: number;
    type?: string;
    [key: string]: unknown;
}

interface TokenInfo {
    exists: boolean;
    value?: string;
    decoded?: JWTPayload | null;
    isExpired?: boolean;
    expiresAt?: string;
}

export default function TokenDebug() {
    const [isVisible, setIsVisible] = useState(false);
    const [accessToken, setAccessToken] = useState<TokenInfo>({ exists: false });
    const [refreshToken, setRefreshToken] = useState<TokenInfo>({ exists: false });

    const decodeJWT = (token: string): { decoded: JWTPayload | null; isExpired: boolean; expiresAt: string } => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded: JWTPayload = JSON.parse(jsonPayload);
            const now = Math.floor(Date.now() / 1000);
            const isExpired = decoded.exp ? decoded.exp < now : false;
            const expiresAt = decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'Unknown';

            return { decoded, isExpired, expiresAt };
        } catch (decodeError) {
            console.error('Error decoding JWT:', decodeError);
            return { decoded: null, isExpired: true, expiresAt: 'Invalid' };
        }
    };

    const updateTokenInfo = () => {
        const accessTokenValue = Cookies.get('access_token');
        const refreshTokenValue = Cookies.get('refresh_token');

        if (accessTokenValue) {
            const { decoded, isExpired, expiresAt } = decodeJWT(accessTokenValue);
            setAccessToken({
                exists: true,
                value: accessTokenValue.substring(0, 50) + '...',
                decoded,
                isExpired,
                expiresAt
            });
        } else {
            setAccessToken({ exists: false });
        }

        if (refreshTokenValue) {
            const { decoded, isExpired, expiresAt } = decodeJWT(refreshTokenValue);
            setRefreshToken({
                exists: true,
                value: refreshTokenValue.substring(0, 50) + '...',
                decoded,
                isExpired,
                expiresAt
            });
        } else {
            setRefreshToken({ exists: false });
        }
    };

    useEffect(() => {
        updateTokenInfo();
        const interval = setInterval(updateTokenInfo, 1000); // Обновляем каждую секунду
        return () => clearInterval(interval);
    }, []);

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => setIsVisible(true)}
                    className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
                >
                    Debug Tokens
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white border rounded-lg shadow-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm">Token Debug Info</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ×
                </button>
            </div>

            <div className="space-y-3 text-xs">
                {/* Access Token */}
                <div className="border-b pb-2">
                    <div className="font-medium text-gray-700">Access Token:</div>
                    <div className={`${accessToken.exists ? 'text-green-600' : 'text-red-600'}`}>
                        {accessToken.exists ? '✓ Exists' : '✗ Missing'}
                    </div>
                    {accessToken.exists && (
                        <>
                            <div className={`${accessToken.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                {accessToken.isExpired ? '✗ Expired' : '✓ Valid'}
                            </div>
                            <div className="text-gray-600">
                                Expires: {accessToken.expiresAt}
                            </div>
                            {accessToken.decoded && (
                                <div className="text-gray-600">
                                    User ID: {accessToken.decoded.sub || 'Unknown'}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Refresh Token */}
                <div className="border-b pb-2">
                    <div className="font-medium text-gray-700">Refresh Token:</div>
                    <div className={`${refreshToken.exists ? 'text-green-600' : 'text-red-600'}`}>
                        {refreshToken.exists ? '✓ Exists' : '✗ Missing'}
                    </div>
                    {refreshToken.exists && (
                        <>
                            <div className={`${refreshToken.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                {refreshToken.isExpired ? '✗ Expired' : '✓ Valid'}
                            </div>
                            <div className="text-gray-600">
                                Expires: {refreshToken.expiresAt}
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={updateTokenInfo}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            Cookies.remove('access_token');
                            Cookies.remove('refresh_token');
                            Cookies.remove('user');
                            updateTokenInfo();
                        }}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
}