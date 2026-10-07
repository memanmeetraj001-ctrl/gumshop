'use client'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Title = ({ title, description, visibleButton = true, href = null }) => {

    return (
        <div className='flex flex-col items-center'>
            <h2 className='text-2xl font-semibold text-slate-800'>{title}</h2>
            {href ? (
                <Link href={href} className='flex items-center gap-5 text-sm text-slate-600 mt-2'>
                    <p className='max-w-lg text-center'>{description}</p>
                    {visibleButton && <span className='text-emerald-600 flex items-center gap-1 font-semibold'>View more <ArrowRight size={14} /></span>}
                </Link>
            ) : (
                <div className='flex items-center gap-5 text-sm text-slate-600 mt-2'>
                    <p className='max-w-lg text-center'>{description}</p>
                </div>
            )}
        </div>
    )
}

export default Title