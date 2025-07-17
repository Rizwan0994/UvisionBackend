const { category: CategoryModel } = require('../models');

const categoriesData = [
    // Main Categories
    {
        id: 1,
        name: 'Photography',
        slug: 'photography',
        description: 'Professional photography services for events, portraits, and commercial needs',
        icon: 'camera',
        color: '#FF6B6B',
        sortOrder: 1
    },
    {
        id: 2,
        name: 'Videography',
        slug: 'videography',
        description: 'Professional video production and cinematography services',
        icon: 'video',
        color: '#4ECDC4',
        sortOrder: 2
    },
    {
        id: 3,
        name: 'Music & Audio',
        slug: 'music-audio',
        description: 'Music production, sound engineering, and live performance services',
        icon: 'music',
        color: '#45B7D1',
        sortOrder: 3
    },
    {
        id: 4,
        name: 'Design & Creative',
        slug: 'design-creative',
        description: 'Graphic design, web design, and creative visual services',
        icon: 'palette',
        color: '#96CEB4',
        sortOrder: 4
    },
    {
        id: 5,
        name: 'Event Planning',
        slug: 'event-planning',
        description: 'Professional event planning and coordination services',
        icon: 'calendar',
        color: '#FFEAA7',
        sortOrder: 5
    },
    {
        id: 6,
        name: 'Beauty & Styling',
        slug: 'beauty-styling',
        description: 'Makeup, hair styling, and beauty services',
        icon: 'brush',
        color: '#DDA0DD',
        sortOrder: 6
    },
    {
        id: 7,
        name: 'Catering & Food',
        slug: 'catering-food',
        description: 'Catering services and professional cooking',
        icon: 'utensils',
        color: '#FFB347',
        sortOrder: 7
    },
    {
        id: 8,
        name: 'Entertainment',
        slug: 'entertainment',
        description: 'Live entertainment, performers, and show services',
        icon: 'theater-masks',
        color: '#FF69B4',
        sortOrder: 8
    },
    
    // Photography Subcategories
    {
        id: 101,
        name: 'Wedding Photography',
        slug: 'wedding-photography',
        description: 'Professional wedding photography services',
        icon: 'heart',
        color: '#FF6B6B',
        parentId: 1,
        sortOrder: 1
    },
    {
        id: 102,
        name: 'Portrait Photography',
        slug: 'portrait-photography',
        description: 'Professional portrait and headshot photography',
        icon: 'user',
        color: '#FF6B6B',
        parentId: 1,
        sortOrder: 2
    },
    {
        id: 103,
        name: 'Event Photography',
        slug: 'event-photography',
        description: 'Corporate and social event photography',
        icon: 'camera',
        color: '#FF6B6B',
        parentId: 1,
        sortOrder: 3
    },
    {
        id: 104,
        name: 'Commercial Photography',
        slug: 'commercial-photography',
        description: 'Product and commercial photography services',
        icon: 'briefcase',
        color: '#FF6B6B',
        parentId: 1,
        sortOrder: 4
    },
    
    // Videography Subcategories
    {
        id: 201,
        name: 'Wedding Videography',
        slug: 'wedding-videography',
        description: 'Professional wedding video production',
        icon: 'video',
        color: '#4ECDC4',
        parentId: 2,
        sortOrder: 1
    },
    {
        id: 202,
        name: 'Corporate Videos',
        slug: 'corporate-videos',
        description: 'Corporate video production and commercials',
        icon: 'building',
        color: '#4ECDC4',
        parentId: 2,
        sortOrder: 2
    },
    {
        id: 203,
        name: 'Music Videos',
        slug: 'music-videos',
        description: 'Music video production and editing',
        icon: 'music',
        color: '#4ECDC4',
        parentId: 2,
        sortOrder: 3
    },
    
    // Music & Audio Subcategories
    {
        id: 301,
        name: 'Live Music',
        slug: 'live-music',
        description: 'Live music performance for events',
        icon: 'microphone',
        color: '#45B7D1',
        parentId: 3,
        sortOrder: 1
    },
    {
        id: 302,
        name: 'DJ Services',
        slug: 'dj-services',
        description: 'Professional DJ services for events',
        icon: 'headphones',
        color: '#45B7D1',
        parentId: 3,
        sortOrder: 2
    },
    {
        id: 303,
        name: 'Sound Engineering',
        slug: 'sound-engineering',
        description: 'Professional sound engineering and audio production',
        icon: 'sliders-h',
        color: '#45B7D1',
        parentId: 3,
        sortOrder: 3
    },
    
    // Design & Creative Subcategories
    {
        id: 401,
        name: 'Graphic Design',
        slug: 'graphic-design',
        description: 'Logo design, branding, and graphic design services',
        icon: 'paint-brush',
        color: '#96CEB4',
        parentId: 4,
        sortOrder: 1
    },
    {
        id: 402,
        name: 'Web Design',
        slug: 'web-design',
        description: 'Website design and development services',
        icon: 'laptop',
        color: '#96CEB4',
        parentId: 4,
        sortOrder: 2
    },
    {
        id: 403,
        name: 'Illustration',
        slug: 'illustration',
        description: 'Custom illustration and artwork services',
        icon: 'pencil-alt',
        color: '#96CEB4',
        parentId: 4,
        sortOrder: 3
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
