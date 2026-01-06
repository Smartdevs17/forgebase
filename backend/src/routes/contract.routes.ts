import { Router } from 'express'
import { getContract } from '../controllers/contract.controller.js'

const router = Router()

router.get('/', getContract)

export default router

