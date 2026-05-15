import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';

export const register=async(req,res)=>{
    const{name,email,password}=req.body;
    

    if(!name||!email||!password){
        return res.json({success:false,message:'All fields are required'});
    }

    try{
        const existingUser=await userModel.findOne({email});
        if(existingUser){
            return res.json({success:false,message:'User already exists'});
        }

        const hashedPassword=await bcrypt.hash(password,10);

        const user=new userModel({name,email,password:hashedPassword});
        await user.save(); 

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});

        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge:7*24*60*60*1000,
        });

        //sending welcome email
        const mailOptions={
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Welcome to our Authentication System',
            text:`Hello ${user.name},\n\nWelcome to our Authentication System! We're glad to have you on board.\n\nBest regards,\nThe Team`,
        };

        await transporter.sendMail(mailOptions);

        res.json({success:true,message:'User registered successfully',user:{name:user.name,email:user.email}});


    }
    catch(error){
        res.json({success:false,message:error.message});
    }
}

export const login=async(req,res)=>{
    const{email,password}=req.body;

    if(!email||!password){
        return res.json({success:false,message:'All fields are required'});
    }


    try{
        const user=await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:'User does not exist'});
        }
        const isMatch=await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.json({success:false,message:'Invalid credentials'});
        }
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'7d'});

        res.cookie('token',token,{
            httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            maxAge:7*24*60*60*1000,
        });

        return res.json({success:true,message:'User logged in successfully',user:{name:user.name,email:user.email}});
    }
    catch(error){
        res.json({success:false,message:error.message});
    }
}

export const logout=async(req,res)=>{
    try{
        res.clearCookie('token',{
             httpOnly:true,
            secure:process.env.NODE_ENV==='production',
            sameSite:process.env.NODE_ENV==='production'?'none':'strict',
            
        });
        return res.json({success:true,message:'User logged out successfully'});
    }
    catch(error){
        res.json({success:false,message:error.message});
    }
}

export const sendVerifyOtp = async (req, res) => {

    try{

        const {userId}=req.body; // we got the user id by the cookies

        const user = await userModel.findById(userId);

        if(user.isAccountVerified){
            return res.json({success:false,message:'Account is already verified'});
        }

        const Otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.verifyOtp = Otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        await user.save();

        const mailOptions={
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Account Verification OTP',
            text:`Hello ${user.name},\n\nYour OTP for account verification is: ${Otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nThe Team`,

        };

        await transporter.sendMail(mailOptions);
        res.json({success:true,message:'OTP sent to your email'});

    }
    catch(error){
        res.json({success:false,message:error.message});
    }
};

export const verifyEmail = async(req,res)=>{
    const {userId,otp}=req.body;

    if(!userId||!otp){
        return res.json({success:false,message:'All fields are required'});
    }

    try{
        const user=await userModel.findById(userId);
        if(!user){
            return res.json({success:false,message:'User does not exist'});
        }
        if(user.verifyOtp!==otp ){
            return res.json({success:false,message:'Invalid OTP'});
        }

        if(user.verifyOtpExpireAt<Date.now()){
            return res.json({success:false,message:'OTP has expired'});
        }

        user.isAccountVerified=true;
        user.verifyOtp='';
        user.verifyOtpExpireAt=0;

        await user.save();

        res.json({success:true,message:'Account verified successfully'});

    }catch(error){
        res.json({success:false,message:error.message});
    }
};

export const isAuthenticated=async(req,res)=>{
    try{
            return res.json({success:true,message:'User is authenticated',user:{name:req.body.name,email:req.body.email}});

    }catch(error){
        res.json({success:false,message:error.message});
    }
}

//send password reset otp
export const sendResetOtp=async(req,res)=>{
    
    const {email}=req.body;
    if(!email){
        return res.json({success:false,message:'Email is required'});
    }
    try{
        const user=await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:'User does not exist'});
        }

        const Otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = Otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        await user.save();

        const mailOptions={
            from:process.env.SENDER_EMAIL,
            to:user.email,
            subject:'Password Reset OTP',
            text:`Hello ${user.name},\n\nYour OTP for password reset is: ${Otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nThe Team`,

        };

        await transporter.sendMail(mailOptions);
        res.json({success:true,message:'OTP sent to your email'});

    }catch(error){  
        res.json({success:false,message:error.message});
    }
}

//reset user pasword
export const resetPassword=async(req,res)=>{
    const {email,otp,newPassword}=req.body;

    if(!email||!otp||!newPassword){
        return res.json({success:false,message:'All fields are required'});
    }

    try{
        const user=await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:'User does not exist'});
        }
        if(user.resetOtp!==otp){
            return res.json({success:false,message:'Invalid OTP'});
        }
        if(user.resetOtpExpireAt<Date.now()){
            return res.json({success:false,message:'OTP has expired'});
        }  
        
        const hashedPassword=await bcrypt.hash(newPassword,10);
        user.password=hashedPassword;
        user.resetOtp='';
        user.resetOtpExpireAt=0;

        await user.save();

        return res.json({success:true,message:'Password reset successfully'});
        
    }
    catch(error){  
        res.json({success:false,message:error.message});
    }
}