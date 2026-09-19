import React from 'react'
import RevenueDashboard from './payment/RevenueDashboard'
import TransactionList from './payment/TransactionList'
import InvoiceManager from './payment/InvoiceManager'
import RefundManager from './payment/RefundManager'
import ManualVerification from './payment/ManualVerification'
import PayoutManager from './payment/PayoutManager'

const PaymentSystem = ({ view }) => {
  switch (view) {
    case 'transactions': return <TransactionList />
    case 'invoices': return <InvoiceManager />
    case 'refunds': return <RefundManager />
    case 'verification': return <ManualVerification />
    case 'disbursements': return <PayoutManager />
    default: return <RevenueDashboard />
  }
}

export default PaymentSystem
