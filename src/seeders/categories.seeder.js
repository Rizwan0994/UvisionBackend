const { category: CategoryModel } = require('../models');

const categoriesData = [
    // Main Categories Only
    {
        id: 1,
        name: 'Events',
        slug: 'events',
        description: 'Professional event planning and coordination services',
        icon: 'calendar-days',
        color: '#FF6B6B',
        sortOrder: 1
    },
    {
        id: 2,
        name: 'Sports',
        slug: 'sports',
        description: 'Sports photography, videography and related services',
        icon: 'futbol',
        color: '#4ECDC4',
        sortOrder: 2
    },
    {
        id: 3,
        name: 'Corporate',
        slug: 'corporate',
        description: 'Corporate photography, videography and business services',
        icon: 'briefcase',
        color: '#45B7D1',
        sortOrder: 3
    },
    {
        id: 4,
        name: 'Fashion',
        slug: 'fashion',
        description: 'Fashion photography, styling and related creative services',
        icon: 'shirt',
        color: '#96CEB4',
        sortOrder: 4
    },
    {
        id: 5,
        name: 'Real Estate',
        slug: 'real-estate',
        description: 'Real estate photography, virtual tours and property marketing',
        icon: 'building',
        color: '#FFEAA7',
        sortOrder: 5
    },
    {
        id: 6,
        name: 'E-commerce',
        slug: 'e-commerce',
        description: 'Product photography and e-commerce visual content creation',
        icon: 'cart-shopping',
        color: '#DDA0DD',
        sortOrder: 6
    },
    {
        id: 7,
        name: 'Social Media',
        slug: 'social-media',
        description: 'Social media content creation and digital marketing services',
        icon: 'hashtag',
        color: '#FFB347',
        sortOrder: 7
    },
    {
        id: 8,
        name: 'Photography',
        slug: 'photography',
        description: 'Professional photography services for all occasions',
        icon: 'camera',
        color: '#FF69B4',
        sortOrder: 8
    },
    {
        id: 9,
        name: 'Videography',
        slug: 'videography',
        description: 'Professional video production and cinematography services',
        icon: 'video',
        color: '#00CEC9',
        sortOrder: 9
    }
];

async function seedCategories() {
    try {
        let newCategoriesCount = 0;
        
        for (const categoryData of categoriesData) {
            const [categoryRecord, created] = await CategoryModel.findOrCreate({
                where: { slug: categoryData.slug },
                defaults: categoryData
            });
            
            if (created) {
                console.log(`✅ Category ${categoryData.name} created successfully 🎉`);
                newCategoriesCount++;
            }
        }
        
        if (newCategoriesCount > 0) {
            console.log(`🌱 Categories seeding completed! Created ${newCategoriesCount} new categories 🚀`);
        } else {
            console.log('🌱 Categories seeding completed 🚀');
        }
    } catch (error) {
        console.error('❌ Error seeding categories:', error);
        throw error;
    }
}

module.exports = seedCategories;
