'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { CardType, Position, User } from '@/types'
import Image from 'next/image'
import mastercardMoeveGow from './mastercard_moeve_gow.png'
import moevePro from './moeve_pro.png'
import moeveGow from './moeve_gow.png'
import './box.css'

interface CardRecordVM { id: string; userId: string; positionId: string; cardType: CardType; count: number }

export default function CardsPage() {
    const { token, isAdmin, user } = useAuth()
    const [records, setRecords] = useState<CardRecordVM[]>([])
    const [positions, setPositions] = useState<Position[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [positionId, setPositionId] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    const canEdit = isAdmin || (user && user.role === 'SUPERVISOR')

    const fetchData = async () => {
        setIsLoading(true)
        const qp = new URLSearchParams()
        if (positionId) qp.append('positionId', positionId)
        const res = await fetch(`/api/cards?${qp.toString()}`)
        if (res.ok) {
            const data = await res.json()
            setRecords(data.records)
            setUsers(data.users)
            setPositions(data.positions)
        }
        setIsLoading(false)
    }

    useEffect(() => { fetchData() }, [positionId])

    const byPositionUsers = useMemo(() => {
        const map: Record<string, User[]> = {}
        for (const p of positions) map[p.id] = []
        for (const u of users) {
            if (!map[u.positionId]) map[u.positionId] = []
            map[u.positionId].push(u)
        }
        return map
    }, [users, positions])

    const getCount = (userId: string, type: CardType) => {
        return records.find(r => r.userId === userId && r.cardType === type)?.count || 0
    }

    const updateCount = async (userId: string, type: CardType, count: number) => {
        if (!canEdit || !token) return
        await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId, positionId: (users.find(u => u.id === userId)?.positionId || ''), cardType: type, count })
        })
        await fetchData()
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Tarjetas de Fidelización</h1>
                    <Link href="/dashboard" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Volver</Link>
                </div>

                {/* Marquee */}
                <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                    <div className="p-4">
                        <div >
                            <div className="img-box flex items-center space-x-6 overflow-x-auto ">
                            <Image src={mastercardMoeveGow} alt="Mastercard Moeve GOW Bankinter" className="cards" />
                            <Image src={moevePro} alt="MOEVE Pro" className="cards" />
                            <Image src={moeveGow} alt="MOEVE GOW" className="cards" />
                            <Image src={mastercardMoeveGow} alt="Mastercard Moeve GOW Bankinter" className="cards" />
                            <Image src={moevePro} alt="MOEVE Pro" className="cards" />
                            <Image src={moeveGow} alt="MOEVE GOW" className="cards" />
                            <Image src={mastercardMoeveGow} alt="Mastercard Moeve GOW Bankinter" className="cards" />
                            <Image src={moevePro} alt="MOEVE Pro" className="cards" />
                            <Image src={moeveGow} alt="MOEVE GOW" className="cards" />
                            <Image src={mastercardMoeveGow} alt="Mastercard Moeve GOW Bankinter" className="cards" />
                            <Image src={moevePro} alt="MOEVE Pro" className="cards" />
                            <Image src={moeveGow} alt="MOEVE GOW" className="cards" />
                            </div>
                        </div>
                        
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posición</label>
                        <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="input w-full">
                            <option value="">Todas</option>
                            {positions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Employees table */}
                {positions.filter(p => !positionId || p.id === positionId).map(p => (
                    <div key={p.id} className="bg-white shadow rounded-lg overflow-hidden mb-6">
                        <div className="px-4 sm:px-6 py-3 border-b text-gray-900 font-medium">{p.name} · Empleados</div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MasterCard Moeve GOW Bankinter</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE Pro</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE GOW</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(byPositionUsers[p.id] || []).map(emp => (
                                        <tr key={emp.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-gray-900">{emp.name}</td>
                                            {[CardType.MASTERCARD_MOEVE_GOW_BANKINTER, CardType.MOEVE_PRO, CardType.MOEVE_GOW].map(type => (
                                                <td key={type} className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-gray-800">{getCount(emp.id, type)}</span>
                                                        {canEdit && (
                                                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                                                <button onClick={() => updateCount(emp.id, type, Math.max(0, getCount(emp.id, type) - 1))} className="px-2 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">-</button>
                                                                <button onClick={() => updateCount(emp.id, type, getCount(emp.id, type) + 1)} className="px-2 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">+</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


