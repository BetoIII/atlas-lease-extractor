"use client"

import type { Transaction } from "../../lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui"

export default function MarketplaceTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>Recent debits and credits from this document</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{transaction.asset}</p>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">
                  {transaction.description} • {transaction.timestamp}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{transaction.counterparty}</p>
            </div>
            <div className={`text-sm font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'credit' ? '+' : '-'}
              {transaction.amount}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
