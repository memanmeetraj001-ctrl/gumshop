'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveStoreSync } from '@/lib/activeStore';
import Loading from '@/components/Loading';

export default function GumroadIntegrationRedirect() {
    const router = useRouter();

    useEffect(() => {
        const active = getActiveStoreSync();
        const slug = active?.username || active?.id || '';
        const dest = slug ? `/store/settings?tab=gumroad&store=${slug}` : `/store/settings?tab=gumroad`;
        router.replace(dest);
    }, [router]);

    return <Loading />;
}
