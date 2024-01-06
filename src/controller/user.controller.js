import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

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
    // console.log("\n", req.files, "\n", req.files?.avatar[0]?.path)
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


const loginUser = asyncHandler(async (req, res) => {

    // req body -> data
    // username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie
    //response

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "password incorrect")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "User Logged in successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {

    // get userid from request
    //extract id
    //clear the cookies

    const { _id } = req.user
    await User.findByIdAndUpdate(_id, {
        $set: { refreshToken: undefined }
    }, { new: true })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {},
                "User Logged out successfully"
            )
        )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    // 1.get refreshToken from cookies


    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)


        const user = await User.findById(decodedToken._id)

        if (!user) {
            throw new ApiError(401, "invalid  refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "unauthorized request token differ")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "AccessToken Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message, "invalid token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if (isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: fasle })

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password Changed"
        )
    )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    // const user = await User.findById(req.user?._id)
    return res.status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "current user fetched successfully"
            )
        )


})

const updateAcountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true }   //returns the updated value     
    ).select("-password")

    res.status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})

const updatedUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        { new: true }   //returns the updated value     
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "avatar image updated"))

})

const updatedUserCover = asyncHandler(async (req, res) => {
    const coverLocalPath = req.file?.path

    if (!coverLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const cover = await uploadOnCloudinary(coverLocalPath)

    if (!cover.url) {
        throw new ApiError(400, "Error while uploading")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: cover.url,
            }
        },
        { new: true }   //returns the updated value     
    ).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "cover image updated"))

})

export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAcountDetails } 