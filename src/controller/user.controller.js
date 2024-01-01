import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    /* 
    get user details from frontend
    watch history and refresh token programmatically
    validation - not empty
    check if user already exist - use email
    check for images , check for avatar - multer
    upload them to cloudinary, avatar
    create user object - create entry in db 
    remove password and refresh token field from response
    check for user creation 
    return response
    */

    //1.
    const {
        username,
        email,
        fullName,
        password, } = req.body

    //2.
    if (
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }

    //3.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    })

    if (existedUser) {
        throw new ApiError(409, "User already exists")
    }

    //4. images on local server
    console.log("\n", req.files, "\n", req.files?.avatar[0]?.path)
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path


    //this part needs an check
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        password,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        refreshToken: "",
    })

    const isUserCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!isUserCreated) {
        throw new ApiError(500, "something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, isUserCreated, "user created successfully")
    )

})

export { registerUser } 