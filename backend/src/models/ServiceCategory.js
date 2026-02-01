import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: String,
        required: true,
        trim: true,
    },
});

const serviceCategorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        trim: true,
    },
    services: [serviceSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

serviceCategorySchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const ServiceCategory = mongoose.model("ServiceCategory", serviceCategorySchema);

export default ServiceCategory;
