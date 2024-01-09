const PORT = process.env.PORT ?? 8000
const express = require('express')
const {v4: uuidv4} = require('uuid')
const app = express()
const pool = require('./db')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.use(cors())
app.use(express.json())

app.use(function (_, response) {
    response.send("<h2>Hello</h2>");
});

//get all todos
app.get('/todos/:userEmail', async(req, res) => {

    // console.log(req)
    const {userEmail} = req.params
    // console.log(userEmail)
    try{
        // const userEmail = 'artur@test.ru'
        const todos = await pool.query('SELECT * FROM todos WHERE user_email = $1', [userEmail])
        res.json(todos.rows)
        console.log(todos.rows)

    }
    catch(e) {
        console.error(e)
    }
})

// create a new todo
app.post('/todos', (req, res) => {
    
    const {user_email, title, progress, date} = req.body
    console.log(user_email, title, progress, date)
    const id = uuidv4()
    
    try{
        const newToDo = pool.query('INSERT INTO todos(id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5)',
         [id, user_email, title, progress, date])
        res.json(newToDo)

    } catch (e) {
        console.error(e)
    }
})

// edit a new todo 
app.put('/todos/:id', async(req, res) => {
    const {id} = req.params
    const {user_email, title, progress, date} = req.body;
    try {
        const editTodo = await pool.query('UPDATE todos SET user_email = $1, title = $2, progress = $3, date = $4 WHERE id = $5', [user_email, title, progress, date, id])
        res.json(editTodo)
    }
    catch (err) {
        console.error(err)
    }
})


// delete a todod
app.delete('/todos/:id', async(req, res) => {
    const {id} = req.params;
   
    try {
        const deleteToDO = await pool.query('DELETE FROM todos WHERE id = $1;', [id])
        res.json(deleteToDO)

    } catch (err) {
        console.error(err)
    }
})

//sign up
app.post('/signup', async(req, res) => {
    const {email, password} = req.body

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)
    try{

        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if(checkUser.rows.length) return res.json({detail: 'The user already exists '})
        
        const signUp = await pool.query('INSERT INTO users (email, hashed_password) VALUES($1, $2)', [email, hashedPassword])
        const token =  jwt.sign({email}, 'secret', {expiresIn: '1hr'})
        res.json({email, token})

    } catch(e) {
        console.error(e)
        if(err) {
            res.json({detail: err.detail})
        }
    }
})

//login
app.post('/login', async(req, res) => {
    const {email, password} = req.body
    const token =  jwt.sign({email}, 'secret', {expiresIn: '1hr'})


    try{

        const user = await pool.query('SELECT * FROM users WHERE email=$1', [email])
        if(!user.rows.length) res.json({detail: "There isn't such user"})
        else {
            const oldHashedPassword = await user.rows[0].hashed_password
            
            const match = await bcrypt.compare(password, oldHashedPassword)

            if(match) {
                res.json({email, token})
            } else {
                res.json({detail: 'Password is wrong'})
            }
        }
        
    } catch(e) {
        console.error(e)
    }
})


app.listen(PORT, ()=> console.log(`Server running on PORT ${PORT}`))
