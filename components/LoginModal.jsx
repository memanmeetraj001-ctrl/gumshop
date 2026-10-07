'use client'
import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { XIcon, Zap, Sparkles } from "lucide-react"
import toast from "react-hot-toast"

export default function LoginModal({ onClose }) {
    const { signIn, signUp, signInWithGoogle } = useAuth()

    const [isSignUp, setIsSignUp] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            await signInWithGoogle()
            toast.success("Signed in with Google successfully!")
            onClose()
        } catch (error) {
            console.error("Google sign-in error:", error)
            toast.error(error.message || "Google sign-in was cancelled or blocked by popup blocker.")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (isSignUp) {
                await signUp(email, password, name)
                toast.success("Account created successfully!")
            } else {
                await signIn(email, password)
                toast.success("Signed in successfully!")
            }
            onClose()
        } catch (error) {
            toast.error(error.message || "Authentication failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative border border-slate-200 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                
                {/* Close button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
                    aria-label="Close"
                >
                    <XIcon size={18} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <Zap size={24} className="fill-emerald-600 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {isSignUp ? "Launch Your Store" : "Welcome Back"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        1-Click access to your store dashboard, 60-second cloner, and customer orders.
                    </p>
                </div>

                {/* Primary 1-Step Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 shadow-sm active:scale-98 transition disabled:opacity-50"
                >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google (1-Click)</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 border-t border-slate-200"></div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">or with email</span>
                    <div className="flex-1 border-t border-slate-200"></div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password (minimum 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                        required
                        minLength={6}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-1 bg-emerald-600 text-white py-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 active:scale-98 shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
                    >
                        {loading ? "Processing..." : isSignUp ? "Create Free Account" : "Sign In to Dashboard"}
                    </button>
                </form>

                {/* Toggle Sign Up / Sign In */}
                <p className="text-center text-xs text-slate-500 mt-5">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-emerald-600 font-bold hover:underline">
                        {isSignUp ? "Sign In" : "Sign Up Free"}
                    </button>
                </p>

            </div>
        </div>
    )
}
