'use client'

import { Star } from 'lucide-react';
import React, { useState } from 'react'
import { XIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import { createRating } from '@/lib/firebaseDb';
import { useDispatch } from 'react-redux';
import { addRating } from '@/lib/features/rating/ratingSlice';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const { user } = useAuth();
    const dispatch = useDispatch();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState('');

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (rating <= 0) {
            return toast.error('Please select a star rating (1–5 stars)');
        }
        if (!review.trim() || review.trim().length < 3) {
            return toast.error('Please write a short review (at least 3 characters)');
        }

        setIsSubmitting(true);
        const effectiveUid = user?.uid || (typeof window !== 'undefined' ? localStorage.getItem('gumshop_guest_uid') || `buyer_${Date.now()}` : 'buyer_customer');
        const ratingData = {
            rating,
            review: review.trim(),
            userId: effectiveUid,
            productId: ratingModal.productId,
            orderId: ratingModal.orderId,
        };

        try {
            await createRating(ratingData);
            dispatch(addRating(ratingData));
            toast.success('Thank you! Your verified rating was submitted! ⭐');
            setRatingModal(null);
        } catch (err) {
            console.error('Rating submit error:', err);
            toast.error('Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in'>
            <div className='bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm relative border border-slate-200'>
                <button onClick={() => setRatingModal(null)} className='absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition'>
                    <XIcon size={18} />
                </button>
                <h2 className='text-xl font-black text-slate-900 mb-1'>Rate Your Purchase</h2>
                <p className="text-xs text-slate-500 mb-4">Share your honest feedback to help future shoppers.</p>
                
                <div className='flex items-center justify-center gap-1.5 mb-5 py-2 bg-slate-50 rounded-2xl border border-slate-100'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-7 cursor-pointer transition-transform hover:scale-115 ${rating > i ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>
                <textarea
                    className='w-full p-3 border border-slate-200 rounded-2xl mb-4 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition'
                    placeholder='Write a short review about the product quality, shipping speed, etc.'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                ></textarea>
                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className='w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50'
                >
                    {isSubmitting ? 'Submitting Review...' : 'Submit Verified Rating'}
                </button>
            </div>
        </div>
    )
}

export default RatingModal