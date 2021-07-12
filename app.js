const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const lodash=require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
mongoose.connect("mongodb+srv://admin-aditya:KBw2PvFSvrBB3jC@todolist.4lfvy.mongodb.net/todolistDB?retryWrites=true&w=majority",{useNewUrlParser:true,useUnifiedTopology:true});



const itemsSchema=new mongoose.Schema({
    name:String
});

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
    name:"Welcome to your todo list!"
});

const item2=new Item({
    name:"Hit the + sign to add an item!"
});

const item3=new Item({
    name:"<-- Hit this to delete an item!"
});

const defaultItems=[item1,item2,item3];

const listSchema=new mongoose.Schema({
    name:String,   
    items:[itemsSchema]
});

const List=mongoose.model("List",listSchema);



app.get("/",function(req,res)
{
    Item.find({},function(err,items){
        if(err)
        {
            console.log(err);
        }
        else if(items.length===0)
        {
            Item.insertMany(defaultItems,function(err){
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    console.log("successfully saved default Items!");
                }
                
            });
        }
        
        res.render("list",{listTitle: "Today", newItems:items});
    });
});

// Till we have no favicon this is a workaround for dynamic routes to not log favicon.ico
app.get("/favicon.ico",function(req,res)
{
    res.sendStatus(204);
});
// The workaround was only present uptill here


app.get("/:customListName",function(req,res)
{
    var customListName= lodash.capitalize(req.params.customListName);
    List.findOne({ name: customListName }, async function (err, foundList) {
        if (!err) {
            if (!foundList) {
                let list=new List({
                    name:customListName,
                    items:defaultItems
                });
                await list.save();
                res.redirect("/" + customListName);
            } 
            else {
                res.render("list", {
                    listTitle: customListName,
                    newItems: foundList.items
                });
            }
        }
    });
});



app.post("/",function(req,res)
{
    var item=req.body.listPoint;
    var listName=req.body.list;
    let newItem=new Item({
        name:item
    });
    

    if(listName=="Today")
    {
        newItem.save();
        res.redirect("/");
    }
    else
    {
        List.findOne({name:listName},function(err,foundList){
            if(err)
            {
                console.log(err);
            }
            else
            {
                foundList.items.push(newItem);
                foundList.save();
                res.redirect("/"+listName);
            }
        });
    }  
});

app.post("/delete",function(req,res)
{
    let todeleteItemId=req.body.checkbox;
    let listName=req.body.listName;
    if(listName ==="Today")
    {
        Item.deleteOne({_id:todeleteItemId},function(err){
            if(err)
            {
                console.log(err);
            }
            else
            {
                console.log("successfully deleted");
                
            }
            setTimeout(function(){
                res.redirect("/");
            },500);
        });
    }
    else
    {
        List.findOneAndUpdate({name:listName},{$pull: {items: { _id:todeleteItemId }}} ,function(err,foundList)
        {
            if(err)
            {
                console.log(err);
            }
            else
            {
                setTimeout(function(){
                    res.redirect("/"+listName);
                },500);
            }
        });
    }
});

app.listen(3000 || process.env.PORT,function()
{
    console.log("server has started successfully");
});

