#!/bin/bash

# Продактивити Платформ суулгах скрипт
# Usage: ./setup.sh [dev|prod|test]

set -e

COLOR_RESET="\033[0m"
COLOR_RED="\033[31m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_BLUE="\033[34m"
COLOR_MAGENTA="\033[35m"
COLOR_CYAN="\033[36m"

print_step() {
    echo -e "${COLOR_CYAN}==>${COLOR_RESET} ${COLOR_BLUE}$1${COLOR_RESET}"
}

print_success() {
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"
}

print_error() {
    echo -e "${COLOR_RED}✗${COLOR_RESET} $1"
}

print_warning() {
    echo -e "${COLOR_YELLOW}!${COLOR_RESET} $1"
}

check_dependencies() {
    print_step "Шаардлагатай программуудыг шалгаж байна..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker суугаагүй байна"
        echo "Docker суулгах: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker суугаад байна"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose суугаагүй байна"
        echo "Docker Compose суулгах: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose суугаад байна"
    
    # Check Node.js (optional)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        print_success "Node.js $NODE_VERSION суугаад байна"
    else
        print_warning "Node.js суугаагүй байна (заавал биш)"
    fi
}

setup_environment() {
    local env_type=$1
    
    print_step "Environment файл бэлтгэж байна..."
    
    # Copy environment files
    if [ -f ".env" ]; then
        print_warning ".env файл аль хэдийн байна. Backup хийж байна..."
        cp .env ".env.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    case $env_type in
        dev)
            cp .env.example .env
            print_success "Development environment файл үүсгэгдлээ"
            ;;
        prod)
            if [ -f ".env.production.example" ]; then
                cp .env.production.example .env
            else
                cp .env.example .env
            fi
            print_success "Production environment файл үүсгэгдлээ"
            ;;
        test)
            cp .env.test.example .env 2>/dev/null || cp .env.example .env
            print_success "Test environment файл үүсгэгдлээ"
            ;;
        *)
            cp .env.example .env
            print_success "Default environment файл үүсгэгдлээ"
            ;;
    esac
    
    # Generate secrets if needed
    if grep -q "your-secret-key" .env; then
        print_step "Хамгаалалтын түлхүүрүүдийг үүсгэж байна..."
        
        # Generate JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i.bak "s|your-secret-key|$JWT_SECRET|g" .env
        
        # Generate refresh secret
        JWT_REFRESH_SECRET=$(openssl rand -base64 32)
        sed -i.bak "s|your-refresh-secret-key|$JWT_REFRESH_SECRET|g" .env
        
        # Generate database password
        DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9')
        sed -i.bak "s|productivity123|$DB_PASSWORD|g" .env
        
        rm -f .env.bak
        print_success "Хамгаалалтын түлхүүрүүд үүсгэгдлээ"
    fi
    
    print_warning ".env файлыг тохируулахаа мартуузай!"
}

setup_database() {
    print_step "Database бэлтгэж байна..."
    
    # Start PostgreSQL
    docker-compose up -d postgres
    
    # Wait for PostgreSQL to be ready
    print_step "PostgreSQL бэлтгэгдэхийг хүлээж байна..."
    for i in {1..30}; do
        if docker-compose exec postgres pg_isready -U productivity; then
            print_success "PostgreSQL бэлэн боллоо"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL бэлтгэгдэхэд хэтэрхий удаан зарлаа"
            exit 1
        fi
    done
    
    # Run migrations
    print_step "Database migration ажиллуулж байна..."
    docker-compose run --rm backend npm run migration:run
    
    # Seed database
    print_step "Seed data оруулж байна..."
    docker-compose run --rm backend npm run seed
    
    print_success "Database бэлэн боллоо"
}

start_services() {
    local env_type=$1
    
    print_step "Сервисүүдийг эхлүүлж байна..."
    
    case $env_type in
        dev)
            docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
            ;;
        prod)
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
            ;;
        test)
            docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d
            ;;
        *)
            docker-compose up -d
            ;;
    esac
    
    print_success "Сервисүүд эхлүүлэгдлээ"
}

show_status() {
    print_step "Системийн статус шалгаж байна..."
    
    echo ""
    echo -e "${COLOR_MAGENTA}┌────────────────────────────────────────────┐${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│        Системийн статус                   │${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}├────────────────────────────────────────────┤${COLOR_RESET}"
    
    # Check services
    SERVICES=("postgres" "redis" "backend" "admin-web")
    
    for service in "${SERVICES[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            echo -e "${COLOR_MAGENTA}│${COLOR_RESET} ${COLOR_GREEN}✓${COLOR_RESET} $service ${COLOR_GREEN}ажиллаж байна${COLOR_RESET}"
        else
            echo -e "${COLOR_MAGENTA}│${COLOR_RESET} ${COLOR_RED}✗${COLOR_RESET} $service ${COLOR_RED}ажиллахгүй байна${COLOR_RESET}"
        fi
    done
    
    echo -e "${COLOR_MAGENTA}├────────────────────────────────────────────┤${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│        Холболтын мэдээлэл                 │${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}├────────────────────────────────────────────┤${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} Backend API:   ${COLOR_CYAN}http://localhost:3000${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} Admin Web:     ${COLOR_CYAN}http://localhost:3001${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} API Docs:      ${COLOR_CYAN}http://localhost:3000/api${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} PGAdmin:       ${COLOR_CYAN}http://localhost:5050${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} Database:      ${COLOR_CYAN}localhost:5432${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}└────────────────────────────────────────────┘${COLOR_RESET}"
    echo ""
    
    print_warning "Эхний нэвтрэлт:"
    echo "  Email: admin@productivity.local"
    echo "  Password: admin123"
    echo ""
    print_warning ".env файлыг тохируулахаа мартуузай!"
}

cleanup() {
    print_step "Хуучин контейнеруудыг цэвэрлэж байна..."
    
    docker-compose down -v 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
    
    print_success "Цэвэрлэгдлээ"
}

main() {
    echo -e "${COLOR_MAGENTA}"
    echo "┌────────────────────────────────────────────┐"
    echo "│    Продактивити Платформ Суулгах          │"
    echo "└────────────────────────────────────────────┘"
    echo -e "${COLOR_RESET}"
    
    ENV_TYPE=${1:-dev}
    
    case $ENV_TYPE in
        dev|prod|test)
            print_step "$ENV_TYPE орчинд суулгаж байна..."
            ;;
        *)
            print_error "Буруу орчин төрөл: $ENV_TYPE"
            echo "Хэрэглэх: $0 [dev|prod|test]"
            exit 1
            ;;
    esac
    
    # Check dependencies
    check_dependencies
    
    # Cleanup old containers
    cleanup
    
    # Setup environment
    setup_environment $ENV_TYPE
    
    # Start services
    start_services $ENV_TYPE
    
    # Setup database
    setup_database
    
    # Show status
    show_status
    
    echo ""
    print_success "Продактивити Платформ амжилттай суулаа! 🎉"
    echo ""
}

# Run main function
main "$@"