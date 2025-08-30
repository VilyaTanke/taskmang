import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabaseInitialized } from '@/lib/init'
import { getAuthUser, isSupervisor } from '@/lib/auth'
import { createOrUpdateCardRecord, getCardRecordsByFilters, getAllPositions } from '@/lib/database'

export async function GET(request: NextRequest) {
  await ensureDatabaseInitialized()
  const { searchParams } = new URL(request.url)
  const positionId = searchParams.get('positionId') || undefined
  const records = await getCardRecordsByFilters({ positionId })
  const positions = await getAllPositions()
  return NextResponse.json({ records, positions })
}

export async function POST(request: NextRequest) {
  await ensureDatabaseInitialized()
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = await (async () => {
    const res = await getAuthUser(request as unknown as Request)
    return res.success ? res.user : null
  })()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isSupervisor(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { userId, positionId, cardType, count } = body || {}
  if (!userId || !positionId || !cardType || typeof count !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const record = await createOrUpdateCardRecord({ userId, positionId, cardType, count })
  return NextResponse.json(record)
}


