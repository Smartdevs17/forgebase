import { Router } from 'express'
import { getReceipt } from '../controllers/receipt.controller.js'

const router = Router()

router.get('/:txHash', getReceipt)

export default router

