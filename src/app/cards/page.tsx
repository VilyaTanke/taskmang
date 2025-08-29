'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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
    
    // Filter positions based on user's assigned positions
    const userPositions = useMemo(() => {
        if (isAdmin) return positions // Admin can see all positions
        if (!user?.positionIds) return []
        return positions.filter(p => user.positionIds.includes(p.id))
    }, [positions, user?.positionIds, isAdmin])
    
    // Set initial positionId to user's first position if not admin
    useEffect(() => {
        if (!isAdmin && user?.positionIds && user.positionIds.length > 0 && !positionId) {
            setPositionId(user.positionIds[0])
        }
    }, [isAdmin, user?.positionIds, positionId])

    const fetchData = useCallback(async () => {
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
    }, [positionId])

    useEffect(() => { fetchData() }, [positionId, fetchData])

    const byPositionUsers = useMemo(() => {
        const map: Record<string, User[]> = {}
        // Only include positions that the user can see
        const allowedPositions = isAdmin ? positions : userPositions
        for (const p of allowedPositions) map[p.id] = []
        for (const u of users) {
            // Handle multiple positions per user
            for (const positionId of u.positionIds || []) {
                if (!map[positionId]) map[positionId] = []
                map[positionId].push(u)
            }
        }
        return map
    }, [users, positions, userPositions, isAdmin])

    const getCount = useCallback((userId: string, type: CardType, positionId?: string) => {
        if (positionId) {
            // Get count for specific position
            return records.find(r => r.userId === userId && r.cardType === type && r.positionId === positionId)?.count || 0
        } else {
            // Get total count across all positions
            return records
                .filter(r => r.userId === userId && r.cardType === type)
                .reduce((sum, r) => sum + r.count, 0)
        }
    }, [records])

    const updateCount = async (userId: string, type: CardType, count: number, positionId: string) => {
        if (!canEdit || !token) return
        await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId, positionId, cardType: type, count })
        })
        await fetchData()
    }

    // Calculate totals by employee (across all positions)
    const employeeTotals = useMemo(() => {
        const totals: Record<string, { name: string; total: number; mastercard: number; moevePro: number; moeveGow: number }> = {}
        
        // Filter users to only include those from allowed positions
        const allowedUsers = isAdmin ? users : users.filter(user => 
            user.positionIds?.some(posId => userPositions.some(p => p.id === posId))
        )
        
        for (const user of allowedUsers) {
            const mastercard = getCount(user.id, CardType.MASTERCARD_MOEVE_GOW_BANKINTER) // No position specified = sum all positions
            const moevePro = getCount(user.id, CardType.MOEVE_PRO) // No position specified = sum all positions
            const moeveGow = getCount(user.id, CardType.MOEVE_GOW) // No position specified = sum all positions
            const total = mastercard + moevePro + moeveGow
            
            if (total > 0) {
                totals[user.id] = {
                    name: user.name,
                    total,
                    mastercard,
                    moevePro,
                    moeveGow
                }
            }
        }
        
        return Object.values(totals).sort((a, b) => b.total - a.total)
    }, [users, getCount, userPositions, isAdmin])

    // Calculate totals by position
    const positionTotals = useMemo(() => {
        const totals: Record<string, { name: string; total: number; mastercard: number; moevePro: number; moeveGow: number }> = {}
        
        // Only calculate totals for positions the user can see
        const allowedPositions = isAdmin ? positions : userPositions
        
        for (const position of allowedPositions) {
            const positionUsers = byPositionUsers[position.id] || []
            let mastercard = 0
            let moevePro = 0
            let moeveGow = 0
            
            for (const user of positionUsers) {
                mastercard += getCount(user.id, CardType.MASTERCARD_MOEVE_GOW_BANKINTER, position.id)
                moevePro += getCount(user.id, CardType.MOEVE_PRO, position.id)
                moeveGow += getCount(user.id, CardType.MOEVE_GOW, position.id)
            }
            
            const total = mastercard + moevePro + moeveGow
            
            if (total > 0) {
                totals[position.id] = {
                    name: position.name,
                    total,
                    mastercard,
                    moevePro,
                    moeveGow
                }
            }
        }
        
        return Object.values(totals).sort((a, b) => b.total - a.total)
    }, [positions, byPositionUsers, getCount, userPositions, isAdmin])

    // Calculate grand total
    const grandTotal = useMemo(() => {
        let mastercard = 0
        let moevePro = 0
        let moeveGow = 0
        
        // Filter records to only include those from allowed positions
        const allowedRecords = isAdmin ? records : records.filter(record => 
            userPositions.some(p => p.id === record.positionId)
        )
        
        for (const record of allowedRecords) {
            switch (record.cardType) {
                case CardType.MASTERCARD_MOEVE_GOW_BANKINTER:
                    mastercard += record.count
                    break
                case CardType.MOEVE_PRO:
                    moevePro += record.count
                    break
                case CardType.MOEVE_GOW:
                    moeveGow += record.count
                    break
            }
        }
        
        return {
            total: mastercard + moevePro + moeveGow,
            mastercard,
            moevePro,
            moeveGow
        }
    }, [records, userPositions, isAdmin])

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estación</label>
                        <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className="input w-full">
                            <option value="">Todas</option>
                            {userPositions.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Employees table */}
                {userPositions.filter(p => !positionId || p.id === positionId).map(p => (
                    <div key={p.id} className="bg-white shadow rounded-lg overflow-hidden mb-6">
                        <div className="px-4 sm:px-6 py-3 border-b text-gray-900 font-medium">{p.name} · Empleados</div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    {/*<tr className="Datarj">
                                        <Image src={mastercardMoeveGow} alt="Mastercard Moeve GOW Bankinter" className="one h-auto w-25" />
                                        <Image src={moevePro} alt="MOEVE Pro" className="two h-auto w-25" />
                                        <Image src={moeveGow} alt="MOEVE GOW" className="h-auto w-25 three" />
                                    </tr>*/}
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
                                                         <span className="text-gray-800">{getCount(emp.id, type, p.id)}</span>
                                                         {canEdit && (
                                                             <div className="inline-flex rounded-md shadow-sm" role="group">
                                                                 <button onClick={() => updateCount(emp.id, type, Math.max(0, getCount(emp.id, type, p.id) - 1), p.id)} className="px-2 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-l hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">-</button>
                                                                 <button onClick={() => updateCount(emp.id, type, getCount(emp.id, type, p.id) + 1, p.id)} className="px-2 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-r hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">+</button>
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

                {/* Summary Tables */}
                <div className="space-y-6">
                    {/* Employee Totals Table */}
                    {employeeTotals.length > 0 && (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 border-b text-gray-900 font-medium bg-blue-50">
                                📊 Resumen por Empleado (Todas las Estaciones)
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MasterCard Moeve GOW Bankinter</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE Pro</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE GOW</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {employeeTotals.map((employee, index) => (
                                            <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-medium">{employee.name}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-blue-600">{employee.mastercard}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-green-600">{employee.moevePro}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-purple-600">{employee.moeveGow}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-bold">{employee.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Position Totals Table */}
                    {positionTotals.length > 0 && (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 border-b text-gray-900 font-medium bg-green-50">
                                🏢 Resumen por Estación
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estación</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MasterCard Moeve GOW Bankinter</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE Pro</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE GOW</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {positionTotals.map((position, index) => (
                                            <tr key={index} className={index < 3 ? 'bg-green-50' : ''}>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-medium">{position.name}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-blue-600">{position.mastercard}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-green-600">{position.moevePro}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-purple-600">{position.moeveGow}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-900 font-bold">{position.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Grand Total Table */}
                    {grandTotal.total > 0 && (
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 border-b text-gray-900 font-medium bg-purple-50">
                                🎯 Total General de Tarjetas
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MasterCard Moeve GOW Bankinter</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE Pro</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MOEVE GOW</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total General</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        <tr className="bg-purple-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-blue-600 text-lg font-bold">{grandTotal.mastercard}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-green-600 text-lg font-bold">{grandTotal.moevePro}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-purple-600 text-lg font-bold">{grandTotal.moeveGow}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xl font-bold">{grandTotal.total}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


