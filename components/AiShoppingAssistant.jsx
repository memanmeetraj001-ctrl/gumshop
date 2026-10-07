'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageCircle, X, Send, ShoppingBag, Zap, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AiShoppingAssistant({ products = [], storeName = 'Store', themeColor = '#10B981', onSelectProduct }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'm_welcome',
            sender: 'ai',
            text: `Hi! 👋 I'm your AI Shopping Assistant for ${storeName}. Ask me anything about our products, express courier shipping, or tracking your order!`,
            suggestions: [
                '🔥 Best sellers',
                '⚡ Any discount codes?',
                '📦 How does shipping work?'
            ]
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = (textToSend) => {
        const query = (textToSend || inputValue).trim();
        if (!query) return;

        const userMsg = {
            id: `usr_${Date.now()}`,
            sender: 'user',
            text: query
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            let aiReply = {
                id: `ai_${Date.now()}`,
                sender: 'ai',
                text: '',
                matchedProducts: [],
                couponCode: null,
                suggestions: []
            };

            if (lowerQuery.includes('best') || lowerQuery.includes('seller') || lowerQuery.includes('popular') || lowerQuery.includes('recommend')) {
                aiReply.text = `Here are our top-rated flagship items from ${storeName}:`;
                aiReply.matchedProducts = products.slice(0, 2);
                aiReply.suggestions = ['⚡ Any discount codes?', '📦 How does shipping work?'];
            } else if (lowerQuery.includes('discount') || lowerQuery.includes('code') || lowerQuery.includes('coupon') || lowerQuery.includes('deal') || lowerQuery.includes('sale')) {
                aiReply.text = `🎉 Yes! Use code SAVE10 at checkout for an instant 10% discount on your order.`;
                aiReply.couponCode = 'SAVE10';
                aiReply.suggestions = ['🔥 Show best sellers', '📦 Express shipping details'];
            } else if (lowerQuery.includes('delivery') || lowerQuery.includes('shipping') || lowerQuery.includes('ship') || lowerQuery.includes('track') || lowerQuery.includes('receive')) {
                aiReply.text = `📦 Tracked Courier Shipping: All physical orders are carefully packed in protective packaging and dispatched within 24–48 hours. You'll receive a live courier tracking number sent directly via SMS & email the moment it ships!`;
                aiReply.suggestions = ['🔥 What are your bestsellers?', '⚡ Any discount codes?'];
            } else if (lowerQuery.includes('refund') || lowerQuery.includes('guarantee') || lowerQuery.includes('return') || lowerQuery.includes('support')) {
                aiReply.text = `🛡️ 30-Day Physical Guarantee: All products arrive brand new, factory sealed, with transit damage insurance and dedicated support on WhatsApp.`;
                aiReply.suggestions = ['🔥 Browse best sellers'];
            } else {
                // Fuzzy search against product titles
                const matched = products.filter(p => 
                    (p.name || '').toLowerCase().includes(lowerQuery) || 
                    (p.description || '').toLowerCase().includes(lowerQuery)
                );

                if (matched.length > 0) {
                    aiReply.text = `I found these matching items for you:`;
                    aiReply.matchedProducts = matched.slice(0, 2);
                    aiReply.suggestions = ['⚡ Any discount codes?', '📦 How does delivery work?'];
                } else {
                    aiReply.text = `I'd love to help you find the perfect product! Take a look at our curated catalog below:`;
                    aiReply.matchedProducts = products.slice(0, 2);
                    aiReply.suggestions = ['🔥 Show best sellers', '⚡ Any discount codes?'];
                }
            }

            setMessages(prev => [...prev, aiReply]);
            setIsTyping(false);
        }, 600);
    };

    return (
        <aside aria-label="AI Shopping Assistant" className="fixed bottom-4 right-4 z-40">
            {/* Floating Trigger Pill */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-full bg-slate-950 text-white shadow-xl hover:shadow-2xl border border-slate-800 transition active:scale-95 group cursor-pointer"
                    style={{ borderColor: `${themeColor}40` }}
                >
                    <span 
                        className="size-7 rounded-full flex items-center justify-center text-slate-950"
                        style={{ backgroundColor: themeColor }}
                    >
                        <Sparkles size={14} className="animate-spin-slow" />
                    </span>
                    <span className="text-xs font-bold tracking-tight">Ask Store AI</span>
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>
            )}

            {/* Chat Modal / Popover */}
            {isOpen && (
                <div className="w-[330px] sm:w-[360px] h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div 
                        className="p-3.5 px-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0"
                    >
                        <div className="flex items-center gap-2.5">
                            <span 
                                className="size-8 rounded-xl flex items-center justify-center text-slate-950 shadow-xs"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Sparkles size={16} />
                            </span>
                            <div>
                                <h4 className="text-xs font-extrabold tracking-tight text-white">{storeName} Assistant</h4>
                                <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>Online • Instant Answers</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Close assistant"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
                        {messages.map(msg => (
                            <div 
                                key={msg.id} 
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div 
                                    className={`max-w-[85%] p-3 rounded-2xl ${
                                        msg.sender === 'user'
                                            ? 'bg-slate-900 text-white rounded-tr-xs'
                                            : 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs rounded-tl-xs'
                                    }`}
                                >
                                    <p className="leading-relaxed">{msg.text}</p>

                                    {/* Coupon Pill Generator */}
                                    {msg.couponCode && (
                                        <div className="mt-2.5 p-2 bg-emerald-50 rounded-xl border border-dashed border-emerald-300 flex items-center justify-between gap-2">
                                            <span className="font-mono font-bold text-emerald-800 text-[11px]">{msg.couponCode}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(msg.couponCode);
                                                    toast.success("Coupon copied!");
                                                }}
                                                className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md hover:bg-emerald-700 transition"
                                            >
                                                Copy Code
                                            </button>
                                        </div>
                                    )}

                                    {/* Dynamic Generative UI Product Cards */}
                                    {msg.matchedProducts && msg.matchedProducts.length > 0 && (
                                        <div className="mt-2.5 space-y-2">
                                            {msg.matchedProducts.map((p, idx) => (
                                                <div 
                                                    key={p.id || idx}
                                                    className="p-2 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2 hover:bg-slate-100 transition"
                                                >
                                                    <img 
                                                        src={p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} 
                                                        alt={p.name}
                                                        className="size-10 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-slate-900 truncate text-[11px]">{p.name}</p>
                                                        <p className="text-[10px] font-black text-emerald-600">
                                                            {parseFloat(p.price) === 0 ? 'Free' : `$${parseFloat(p.price || 0).toFixed(2)}`}
                                                        </p>
                                                    </div>
                                                    {onSelectProduct && (
                                                        <button
                                                            onClick={() => onSelectProduct(p)}
                                                            className="p-1.5 rounded-lg bg-slate-950 text-white hover:bg-slate-800 text-[10px] font-bold shrink-0 flex items-center gap-0.5"
                                                        >
                                                            <span>Buy</span>
                                                            <ArrowRight size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Suggestion Chips */}
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {msg.suggestions.map((sug, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSendMessage(sug)}
                                                className="text-[10px] font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition active:scale-95 shadow-2xs"
                                            >
                                                {sug}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200 w-16 text-slate-400">
                                <span className="size-1.5 bg-slate-400 rounded-full animate-bounce" />
                                <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="size-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0"
                    >
                        <input
                            type="text"
                            placeholder="Ask a question..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950"
                        />
                        <button
                            type="submit"
                            aria-label="Send message"
                            disabled={!inputValue.trim()}
                            className="size-8 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
                        >
                            <Send size={13} />
                        </button>
                    </form>
                </div>
            )}
        </aside>
    );
}
