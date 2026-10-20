import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  HeartHandshake, 
  Compass, 
  Package, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { formatProductImageUrl, handleImageError } from '../utils/imageUrl';

interface HomePageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string, params?: any) => void;
  onSelectCategory: (category: ProductCategory) => void;
}

const CATEGORY_SHOWCASE: {
  name: ProductCategory;
  subtitle: string;
  image: string;
}[] = [
  {
    name: 'Clothing',
    subtitle: 'Jaipuri cotton suits, Farshi ensembles & festive ethnic wear',
    image: '/images/farshi_salwar_suit_1791974973122.jpg',
  },
  {
    name: 'Home Decor',
    subtitle: 'Fluted brass vases, butterfly stands & celestial trays',
    image: '/images/wooden_star_moon_tray_1791974912271.jpg',
  },
  {
    name: 'Kitchen Essentials',
    subtitle: 'Spice organizers, ceramic utensil crocks & cup trees',
    image: '/images/spice_jar_organizer_1791975018891.jpg',
  },
  {
    name: 'Lighting',
    subtitle: 'Moroccan filigree brass lanterns & ambient fairy lights',
    image: '/images/ramadan_lantern_lamp_1791974938367.jpg',
  },
  {
    name: 'Storage & Organization',
    subtitle: 'Airtight glass jars & handwoven natural rope baskets',
    image: '/images/pantry_organizer_jars_1791974938650.jpg',
  },
  {
    name: 'Bedroom Accessories',
    subtitle: 'Hand block print Jaipuri bedsheets & linen cushions',
    image: '/images/handblock_cotton_bedsheet_1791974976145.jpg',
  },
  {
    name: 'Living Room Accessories',
    subtitle: 'Filigree brass lanterns, raw silk runners & accent trays',
    image: '/images/brass_floor_lantern_1791973758625.jpg',
  },
  {
    name: 'Daily-Use Essentials',
    subtitle: 'Carved teak coasters, waffle bath linens & cruets',
    image: '/images/mango_wood_coasters_1791973769204.jpg',
  },
  {
    name: 'Gifts & Lifestyle',
    subtitle: 'Festive Ramadan banquet sets, brass diyas & gift hampers',
    image: '/images/festive_ramadan_decor_1791975078343.jpg',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  products,
  onSelectProduct,
  onNavigate,
  onSelectCategory,
}) => {
  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 sm:pt-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#F4EFE5] border border-[#E8DFC9] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[500px] lg:min-h-[560px]">
            {/* Left Content Column */}
            <div className="lg:col-span-6 p-8 sm:p-12 lg:p-16 flex flex-col justify-center space-y-6 z-10">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#1B4332] bg-[#E8E0CE] px-3.5 py-1.5 rounded-full w-fit">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Handcrafted Indian Living</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1B4332] font-serif-marvi leading-tight">
                  Everyday Essentials, <br />
                  <span className="italic font-normal text-[#2D6A4F]">Beautifully Chosen.</span>
                </h1>
                <p className="text-sm sm:text-base text-[#4D6052] max-w-lg leading-relaxed">
                  Discover thoughtfully crafted home accents, pure brassware, seasoned Sheesham kitchen essentials, and natural organizers made to enrich daily life.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('products')}
                  className="px-6 py-3.5 bg-[#1B4332] hover:bg-[#143225] text-[#FAF7F0] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 active:scale-95"
                >
                  <span>Shop Collection</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
                <button
                  onClick={() => {
                    onSelectCategory('Home Decor');
                    onNavigate('products');
                  }}
                  className="px-5 py-3.5 bg-white/90 hover:bg-white text-[#1B4332] font-semibold text-xs tracking-wider rounded-xl border border-[#DCD3BD] transition-all hover:border-[#1B4332]"
                >
                  Explore Home Decor
                </button>
              </div>

              {/* Quiet Micro Proof Points */}
              <div className="pt-4 border-t border-[#E5DBCA] flex items-center gap-6 text-xs text-[#526657]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
                  <span>Doorstep COD</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
                  <span>Free Shipping ≥ ₹999</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
                  <span>7-Day Return</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Column */}
            <div className="lg:col-span-6 relative h-72 sm:h-96 lg:h-full min-h-[300px]">
              <img
                src={formatProductImageUrl('/images/hero_marvi_home_sanctuary_1791727441824.jpg')}
                alt="Marvi Mart Home Sanctuary Living Room"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#F4EFE5] via-transparent to-transparent opacity-60 lg:opacity-30 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A7642] block mb-1">
              Curated Spaces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              Shop by Category
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Products</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORY_SHOWCASE.map((cat, idx) => (
            <div
              key={cat.name}
              onClick={() => {
                onSelectCategory(cat.name);
                onNavigate('products');
              }}
              className={`group bg-white rounded-2xl border border-[#E9E2D2] overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 flex flex-col ${
                idx === 0 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <div className="aspect-4/3 overflow-hidden bg-[#F4EFE5] relative">
                <img
                  src={formatProductImageUrl(cat.image)}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-[#1B4332]/80 backdrop-blur-xs px-2.5 py-1 rounded-md">
                  Explore →
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="font-semibold text-sm text-[#1B4332] group-hover:text-[#2D6A4F] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#6A7F70] line-clamp-1 mt-1">
                  {cat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A7642] block mb-1">
              Handpicked Pieces
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              Featured Essentials
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1"
          >
            <span>See Full Catalog ({products.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Promotional Story Banner: The Art of Indian Homemaking */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#1B4332] text-[#F9F6EE] rounded-3xl p-8 sm:p-12 lg:p-16 border border-[#2D6A4F] overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 max-w-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                Natural Materials & Craft Heritage
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif-marvi leading-tight">
                Authentic Craftsmanship Built for Daily Use.
              </h2>
              <p className="text-xs sm:text-sm text-[#CAD9CE] leading-relaxed">
                At Marvi Mart, we believe home essentials should balance enduring utility with quiet beauty. Every brass vase, Sheesham masala dabba, and handwoven jute basket is sourced with care from skilled Indian craft clusters.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
                <div className="p-3 bg-[#143225] rounded-xl border border-[#285741]">
                  <p className="font-bold text-white mb-0.5">Pure Brass & Sheesham</p>
                  <p className="text-[#9DB5A4]">Natural finishes without toxic coatings</p>
                </div>
                <div className="p-3 bg-[#143225] rounded-xl border border-[#285741]">
                  <p className="font-bold text-white mb-0.5">Reliable Daily Utility</p>
                  <p className="text-[#9DB5A4]">Tested for modern Indian households</p>
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-4/3 border border-[#2F644B]">
              <img
                src={formatProductImageUrl('/images/kitchen_sheesham_spice_box_1791727469241.jpg')}
                alt="Artisanal Wooden Craftsmanship"
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, '/images/home_decor_brass_vase_1791727457022.jpg')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bestsellers Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8A7642] block mb-1">
              Customer Favorites
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] font-serif-marvi">
              Trending Bestsellers
            </h2>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="text-xs font-semibold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestsellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
