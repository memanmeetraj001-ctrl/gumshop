'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

/**
 * Legacy Store Cloner Route -> Redirect to Modern Import Center
 * Follows Ponytail principle: eliminate redundant cloner code and consolidate into Import Engine.
 */
export default function LegacyClonerRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/store/import');
    }, [router]);

    return <Loading />;
}
