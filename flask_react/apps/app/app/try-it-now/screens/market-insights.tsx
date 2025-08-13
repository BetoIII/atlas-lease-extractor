"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@atlas/ui"
import { TrendingUp, TrendingDown } from "lucide-react"

export function MarketInsights() {
  // Mock data for market insights
  const rentData = [
    { name: "Q1 2023", rent: 42 },
    { name: "Q2 2023", rent: 45 },
    { name: "Q3 2023", rent: 43 },
    { name: "Q4 2023", rent: 47 },
    { name: "Q1 2024", rent: 48 },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Market Insights</h3>
        <Badge variant="outline" className="text-xs">
          San Francisco, CA
        </Badge>
      </div>

      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rentData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[35, 55]} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value) => [`$${value}/SF`, "Avg. Rent"]} labelFormatter={(label) => `${label}`} />
            <Bar dataKey="rent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Avg. Office Rent</span>
            <TrendingUp className="h-3 w-3 text-green-500" />
          </div>
          <div className="font-medium">$48.00/SF</div>
          <div className="text-xs text-green-600">+2.1% QoQ</div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Vacancy Rate</span>
            <TrendingDown className="h-3 w-3 text-red-500" />
          </div>
          <div className="font-medium">12.5%</div>
          <div className="text-xs text-red-600">+0.8% QoQ</div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Avg. Lease Term</span>
          </div>
          <div className="font-medium">62 months</div>
          <div className="text-xs text-gray-500">Class A Office</div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">TI Allowance</span>
            <TrendingUp className="h-3 w-3 text-green-500" />
          </div>
          <div className="font-medium">$65.00/SF</div>
          <div className="text-xs text-green-600">+8.3% YoY</div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        *Based on similar properties in the area. Full market analysis available in the complete version.
      </div>
    </div>
  )
}
