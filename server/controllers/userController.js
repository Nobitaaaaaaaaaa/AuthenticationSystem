import userModel from '../models/userModel.js';

export const getUserData = async(req, res) => {

    try{
        const {userId}=req.body; // we got the user id by the cookies

        const user= await userModel.findById(userId);

        if(!user){
            return res.json({success:false,message:'User not found'});
        }

        res.json({success:true,message:'User data fetched successfully',
            user:{name:user.name,email:user.email,isAccountVerified:user.isAccountVerified}});
    }
    catch(error){
        res.json({success:false,message:error.message});
    }
};