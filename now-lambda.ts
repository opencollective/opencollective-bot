/*****************************************
Wrapper around opencolective-bot to run as Lambdas in Zeit's Now 2.0
*****************************************/
import { toLambda } from 'probot-serverless-now'
import main from './src/index'

export default toLambda(main)
