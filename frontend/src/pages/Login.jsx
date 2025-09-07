import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Collage images for the left panel (desktop)
  const collage = [
    {
      alt: 'Pizza',
      sources: [
        'https://source.unsplash.com/hatqfX3b9Vo/1200x1600',
        'https://foodish-api.com/images/pizza/pizza15.jpg',
        'https://images.pexels.com/photos/4109080/pexels-photo-4109080.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=1',
        'https://images.unsplash.com/photo-1548365328-9f547fb0953c?q=80&w=1200&auto=format&fit=crop'
      ],
      fallback: { emoji: '🍕', label: 'Pizza' }
    },
    {
      alt: 'Burger',
      sources: [
        'https://source.unsplash.com/fdlZBWIP0aM/1200x1600',
        'https://foodish-api.com/images/burger/burger5.jpg',
        'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=1',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop'
      ],
      fallback: { emoji: '🍔', label: 'Burger' }
    },
    {
      alt: 'Curry',
      sources: [
        'https://source.unsplash.com/kcA-c3f_3FE/1200x1600',
        'https://foodish-api.com/images/biryani/biryani31.jpg',
        'https://images.pexels.com/photos/590804/pexels-photo-590804.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=1',
        'https://images.unsplash.com/photo-1604908812879-6882d473fe6c?q=80&w=1200&auto=format&fit=crop'
      ],
      fallback: { emoji: '🍛', label: 'Curry' }
    },
    {
      alt: 'Fries',
      sources: [
        'https://source.unsplash.com/-YHSwy6uqvk/1200x1600',
        'https://foodish-api.com/images/fries/fries8.jpg',
        'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=1',
        'https://images.unsplash.com/photo-1541781139430-f3fdb04443c3?q=80&w=1200&auto=format&fit=crop'
      ],
      fallback: { emoji: '🍟', label: 'Fries' }
    }
  ];

  const from = location.state?.from?.pathname;
  const redirectTo = from && from !== '/login' && from !== '/register' ? from : '/';

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
      setValue('email', savedEmail);
      setValue('remember', true);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await login(data);
      if (result?.success) {
        if (data.remember) {
          localStorage.setItem('rememberEmail', data.email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        navigate(redirectTo, { replace: true });
      } else {
        setError(result?.message || 'Invalid email or password.');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Full-viewport responsive grid: 1 column on mobile, 2 columns on desktop
    <div className="login-layout">
      {/* Left: 2x2 image grid (desktop only) */}
      <div className="login-left">
        <div className="login-tiles">
          {collage.map((img, idx) => (
            <ImageTile key={idx} alt={img.alt} sources={img.sources} fallback={img.fallback} />
          ))}
        </div>
        <div className="login-divider" />
      </div>

      {/* Right: Login card centered */}
      <div className="login-right">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-md p-8">
            <div className="text-center mb-6">
              <h2 className="text-4xl font-bold text-gray-900 mb-1">Welcome back!</h2>
              <p className="text-gray-500">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Password"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center">
                <input id="remember-me" type="checkbox" {...register('remember')} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (<><span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>Signing in...</>) : (<>Sign in<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>)}
              </button>
            </form>

            <div className="mt-6 text-gray-700 text-sm">
              <p className="font-medium mb-2">Demo Credentials</p>
              <p className="flex items-center gap-2">
                <strong>Customer:</strong> john@example.com / Password123
                <button
                  type="button"
                  onClick={() => { setValue('email', 'john@example.com'); setValue('password', 'Password123'); }}
                  className="ml-2 text-orange-600 hover:text-orange-500 underline"
                >
                  Autofill
                </button>
              </p>
              <p className="flex items-center gap-2">
                <strong>Restaurant:</strong> owner@pizzapalace.com / Password123
                <button
                  type="button"
                  onClick={() => { setValue('email', 'owner@pizzapalace.com'); setValue('password', 'Password123'); }}
                  className="ml-2 text-orange-600 hover:text-orange-500 underline"
                >
                  Autofill
                </button>
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don’t have an account?{' '}
                <Link to="/register" className="text-orange-600 hover:text-orange-500 font-medium">Sign up now</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

function ImageTile({ sources, alt, fallback }) {
  const [index, setIndex] = useState(0);
  const src = index < sources.length ? sources[index] : null;
  if (!src) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(135deg, #FFEDD5 0%, #FEE2E2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{fallback?.emoji || '🍽️'}</div>
          <div style={{ color: '#374151', fontWeight: 600 }}>{fallback?.label || alt}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={src}
        alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        decoding="async"
        loading="lazy"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  );
}
