import { Router } from 'express'
import { decodeTransaction, getTransaction } from '../controllers/transaction.controller.js'

const router = Router()

router.post('/decode', decodeTransaction)
router.get('/:txHash', getTransaction)

export default router

