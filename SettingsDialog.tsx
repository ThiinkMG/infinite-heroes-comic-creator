import React, { useState, useEffect } from 'react';

interface Props {
    serverKeyExists: boolean;
    anthropicServerKeyExists: boolean;
    adminPasswordHash: string; // The compiled ADMIN_PASSWORD from .env
    onClose: () => void;
    onKeyChange: (geminiKey: string | null, anthropicKey: string | null, isAdmin: boolean) => void;
}

export const SettingsDialog: React.FC<Props> = ({ serverKeyExists, anthropicServerKeyExists, adminPasswordHash, onClose, onKeyChange }) => {
    const [userKey, setUserKey] = useState(localStorage.getItem('user_api_key') || '');
    const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem('user_anthropic_api_key') || '');
    const [adminPassword, setAdminPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('is_admin') === 'true');
    const [showKey, setShowKey] = useState(false);
    const [showAnthropicKey, setShowAnthropicKey] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [geminiStatus, setGeminiStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [claudeStatus, setClaudeStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [geminiError, setGeminiError] = useState('');
    const [claudeError, setClaudeError] = useState('');

    const handleSaveGeminiKey = async () => {
        const trimmed = userKey.trim();
        setGeminiError('');

        if (!trimmed) {
            localStorage.removeItem('user_api_key');
            onKeyChange(null, anthropicKey.trim() || null, false);
            setGeminiStatus('success');
            setSaveMsg('Gemini key cleared.');
            setTimeout(() => { setSaveMsg(''); setGeminiStatus('idle'); }, 2000);
            return;
        }

        // Basic format validation
        if (!trimmed.startsWith('AIza') || trimmed.length < 30) {
            setGeminiStatus('error');
            setGeminiError('Invalid format. Gemini keys start with "AIza" and are ~39 characters.');
            setTimeout(() => setGeminiStatus('idle'), 4000);
            return;
        }

        // Test the key with a minimal API call
        setGeminiStatus('saving');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`);
            if (response.ok) {
                localStorage.setItem('user_api_key', trimmed);
                onKeyChange(trimmed, anthropicKey.trim() || null, false);
                setGeminiStatus('success');
                setSaveMsg('✓ Gemini key verified and saved!');
                setTimeout(() => { setSaveMsg(''); setGeminiStatus('idle'); }, 3000);
            } else {
                const data = await response.json().catch(() => ({}));
                setGeminiStatus('error');
                setGeminiError(data?.error?.message || `API error: ${response.status}`);
                setTimeout(() => setGeminiStatus('idle'), 5000);
            }
        } catch (e: any) {
            setGeminiStatus('error');
            setGeminiError('Network error. Key saved locally but not verified.');
            localStorage.setItem('user_api_key', trimmed);
            onKeyChange(trimmed, anthropicKey.trim() || null, false);
            setTimeout(() => setGeminiStatus('idle'), 4000);
        }
    };

    const handleSaveAnthropicKey = async () => {
        const trimmed = anthropicKey.trim();
        setClaudeError('');

        if (!trimmed) {
            localStorage.removeItem('user_anthropic_api_key');
            onKeyChange(userKey.trim() || null, null, false);
            setClaudeStatus('success');
            setSaveMsg('Claude key cleared.');
            setTimeout(() => { setSaveMsg(''); setClaudeStatus('idle'); }, 2000);
            return;
        }

        // Basic format validation
        if (!trimmed.startsWith('sk-ant-') || trimmed.length < 40) {
            setClaudeStatus('error');
            setClaudeError('Invalid format. Claude keys start with "sk-ant-" and are longer.');
            setTimeout(() => setClaudeStatus('idle'), 4000);
            return;
        }

        // Test the key with a minimal API call
        setClaudeStatus('saving');
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': trimmed,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'Hi' }]
                })
            });

            if (response.ok || response.status === 200) {
                localStorage.setItem('user_anthropic_api_key', trimmed);
                onKeyChange(userKey.trim() || null, trimmed, false);
                setClaudeStatus('success');
                setSaveMsg('✓ Claude key verified and saved!');
                setTimeout(() => { setSaveMsg(''); setClaudeStatus('idle'); }, 3000);
            } else {
                const data = await response.json().catch(() => ({ error: { message: '' } }));
                if (response.status === 401) {
                    setClaudeStatus('error');
                    setClaudeError(data?.error?.message || 'Invalid API key. Please check and try again.');
                } else {
                    // Other errors might mean the key is valid but there's a usage issue
                    localStorage.setItem('user_anthropic_api_key', trimmed);
                    onKeyChange(userKey.trim() || null, trimmed, false);
                    setClaudeStatus('success');
                    setSaveMsg('✓ Claude key saved! (Could not fully verify)');
                    setTimeout(() => { setSaveMsg(''); setClaudeStatus('idle'); }, 3000);
                }
                if (response.status === 401) {
                    setTimeout(() => setClaudeStatus('idle'), 5000);
                }
            }
        } catch (e: any) {
            // CORS or network error - save anyway since we can't test from browser
            localStorage.setItem('user_anthropic_api_key', trimmed);
            onKeyChange(userKey.trim() || null, trimmed, false);
            setClaudeStatus('success');
            setSaveMsg('✓ Claude key saved! (Browser cannot verify)');
            setTimeout(() => { setSaveMsg(''); setClaudeStatus('idle'); }, 3000);
        }
    };

    const handleAdminLogin = () => {
        if (!adminPasswordHash) {
            setSaveMsg('No admin password configured.');
            setTimeout(() => setSaveMsg(''), 2000);
            return;
        }
        if (adminPassword === adminPasswordHash) {
            localStorage.setItem('is_admin', 'true');
            setIsAdmin(true);
            onKeyChange(null, null, true);
            setSaveMsg('Admin access granted!');
        } else {
            setSaveMsg('Wrong password.');
        }
        setTimeout(() => setSaveMsg(''), 2000);
        setAdminPassword('');
    };

    const handleAdminLogout = () => {
        localStorage.removeItem('is_admin');
        setIsAdmin(false);
        onKeyChange(userKey.trim() || null, anthropicKey.trim() || null, false);
        setSaveMsg('Admin signed out.');
        setTimeout(() => setSaveMsg(''), 2000);
    };

    return (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="max-w-[500px] w-full bg-white border-[6px] border-black shadow-[10px_10px_0px_rgba(0,0,0,0.6)] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gray-900 border-b-[4px] border-black px-6 py-3 flex justify-between items-center">
                    <h2 className="font-comic text-2xl text-white uppercase tracking-wider">⚙️ Settings</h2>
                    <button 
                        onClick={onClose}
                        className="comic-btn bg-red-600 text-white w-10 h-10 flex items-center justify-center font-bold text-xl border-[3px] border-black hover:bg-red-500"
                    >✕</button>
                </div>

                <div className="p-5 flex flex-col gap-5">
                    {/* Status Banner */}
                    {isAdmin && (
                        <div className="bg-green-100 border-[3px] border-green-600 p-3 flex items-center justify-between">
                            <span className="font-comic text-green-800 font-bold text-sm">🔓 ADMIN MODE ACTIVE — Using server API key</span>
                            <button 
                                onClick={handleAdminLogout}
                                className="comic-btn bg-red-500 text-white text-xs px-3 py-1 border-[2px] border-black hover:bg-red-400 font-bold"
                            >Sign Out</button>
                        </div>
                    )}

                    {/* User API Key */}
                    <div className="border-[3px] border-black bg-blue-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-blue-900 mb-2">🔑 Your Gemini API Key</p>
                        <p className="font-comic text-xs text-gray-600 mb-3">
                            Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google AI Studio</a>
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showKey ? 'text' : 'password'}
                                    value={userKey}
                                    onChange={e => { setUserKey(e.target.value); setGeminiStatus('idle'); setGeminiError(''); }}
                                    placeholder="AIzaSy..."
                                    className={`w-full px-3 py-2 border-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10 ${
                                        geminiStatus === 'error' ? 'border-red-500 bg-red-50' :
                                        geminiStatus === 'success' ? 'border-green-500 bg-green-50' : 'border-black'
                                    }`}
                                />
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black text-sm"
                                    type="button"
                                >{showKey ? '🙈' : '👁️'}</button>
                            </div>
                            <button
                                onClick={handleSaveGeminiKey}
                                disabled={geminiStatus === 'saving'}
                                className={`comic-btn text-white px-4 py-2 font-bold text-sm border-[2px] border-black min-w-[70px] ${
                                    geminiStatus === 'saving' ? 'bg-gray-400 cursor-wait' :
                                    geminiStatus === 'success' ? 'bg-green-600 hover:bg-green-500' :
                                    geminiStatus === 'error' ? 'bg-red-600 hover:bg-red-500' :
                                    'bg-blue-600 hover:bg-blue-500'
                                }`}
                            >
                                {geminiStatus === 'saving' ? '...' :
                                 geminiStatus === 'success' ? '✓' :
                                 geminiStatus === 'error' ? '✗' : 'SAVE'}
                            </button>
                        </div>
                        {geminiError && (
                            <p className="font-comic text-xs text-red-600 mt-2 bg-red-100 border border-red-300 p-2 rounded">
                                ⚠️ {geminiError}
                            </p>
                        )}
                    </div>

                    {/* Anthropic/Claude API Key */}
                    <div className="border-[3px] border-black bg-amber-50 p-4">
                        <p className="font-comic text-sm font-bold uppercase text-amber-900 mb-2">🤖 Claude API Key (Anthropic)</p>
                        <p className="font-comic text-xs text-gray-600 mb-3">
                            Get a key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">Anthropic Console</a>
                            {' '}<span className="text-gray-400">(Optional - used for text analysis)</span>
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showAnthropicKey ? 'text' : 'password'}
                                    value={anthropicKey}
                                    onChange={e => { setAnthropicKey(e.target.value); setClaudeStatus('idle'); setClaudeError(''); }}
                                    placeholder="sk-ant-api03-..."
                                    className={`w-full px-3 py-2 border-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10 ${
                                        claudeStatus === 'error' ? 'border-red-500 bg-red-50' :
                                        claudeStatus === 'success' ? 'border-green-500 bg-green-50' : 'border-black'
                                    }`}
                                />
                                <button
                                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black text-sm"
                                    type="button"
                                >{showAnthropicKey ? '🙈' : '👁️'}</button>
                            </div>
                            <button
                                onClick={handleSaveAnthropicKey}
                                disabled={claudeStatus === 'saving'}
                                className={`comic-btn text-white px-4 py-2 font-bold text-sm border-[2px] border-black min-w-[70px] ${
                                    claudeStatus === 'saving' ? 'bg-gray-400 cursor-wait' :
                                    claudeStatus === 'success' ? 'bg-green-600 hover:bg-green-500' :
                                    claudeStatus === 'error' ? 'bg-red-600 hover:bg-red-500' :
                                    'bg-amber-600 hover:bg-amber-500'
                                }`}
                            >
                                {claudeStatus === 'saving' ? '...' :
                                 claudeStatus === 'success' ? '✓' :
                                 claudeStatus === 'error' ? '✗' : 'SAVE'}
                            </button>
                        </div>
                        {claudeError && (
                            <p className="font-comic text-xs text-red-600 mt-2 bg-red-100 border border-red-300 p-2 rounded">
                                ⚠️ {claudeError}
                            </p>
                        )}
                        <p className="font-comic text-[10px] text-gray-500 mt-2">
                            Claude handles: character profiles, outlines, story beats. Gemini handles: image generation.
                        </p>
                    </div>

                    {/* Admin Sign-In */}
                    {!isAdmin && (
                        <div className="border-[3px] border-black bg-purple-50 p-4">
                            <p className="font-comic text-sm font-bold uppercase text-purple-900 mb-2">🛡️ Admin Sign-In</p>
                            <p className="font-comic text-xs text-gray-600 mb-3">
                                Sign in to use the server's built-in API key automatically.
                            </p>
                            <div className="flex gap-2">
                                <input 
                                    type="password"
                                    value={adminPassword}
                                    onChange={e => setAdminPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                                    placeholder="Enter admin password..."
                                    className="flex-1 px-3 py-2 border-2 border-black font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                <button 
                                    onClick={handleAdminLogin}
                                    className="comic-btn bg-purple-600 text-white px-4 py-2 font-bold text-sm border-[2px] border-black hover:bg-purple-500"
                                >LOGIN</button>
                            </div>
                        </div>
                    )}

                    {/* Feedback */}
                    {saveMsg && (
                        <p className="font-comic text-center text-sm font-bold animate-pulse">{saveMsg}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
