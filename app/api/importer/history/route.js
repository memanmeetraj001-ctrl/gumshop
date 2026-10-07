import { NextResponse } from 'next/server';
import { getAllImportHistory } from '@/lib/firebaseDb';

/**
 * GET /api/importer/history
 * Returns the audit trail of imports for Master HQ.
 */
export async function GET() {
    try {
        const history = await getAllImportHistory();
        return NextResponse.json({
            success: true,
            history
        });
    } catch (err) {
        return NextResponse.json({
            success: false,
            error: err.message || 'Failed to load import history',
            history: []
        }, { status: 500 });
    }
}
