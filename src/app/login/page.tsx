'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const success = await login(email, password);

        if (success) {
            router.push('/dashboard');
        } else {
            setError('Credenciales inválidas. Por favor, inténtalo de nuevo.');
        }

        setIsLoading(false);
    };

    return (
        <div className="page-center">


            <div className="max-w-md w-full space-y-8">

                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Ivanje-Gestion
                </h2>
                <p className="card-subtitle mt-2 flex items-center justify-center">Sistema de Gestión de Tareas</p>
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">

                            <div className="flex items-center" style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', background: 'var(--color-primary)', justifyContent: 'center' }}>
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>

                        <form className="form mt-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="label">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="input"
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="input-group">
                                <label htmlFor="password" className="label">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className="input"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="input-right"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    <div className="text-sm font-medium">Error de autenticación</div>
                                    <div className="mt-2 text-sm">{error}</div>
                                </div>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary w-100"
                                >
                                    {isLoading ? <span className="spinner"></span> : null}
                                    {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                                </button>
                            </div>

                            <div className="text-center mt-4">
                                <p className="text-xs text-muted">
                                    Credenciales de prueba: admin@taskmang.com / admin123
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
