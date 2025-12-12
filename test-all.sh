#!/bin/bash

# Продактивити Платформ тестийн скрипт
# Usage: ./test-all.sh [unit|e2e|integration|all]

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

run_unit_tests() {
    print_step "Backend unit тест ажиллуулж байна..."
    
    cd backend
    if npm test; then
        print_success "Backend unit тест амжилттай"
    else
        print_error "Backend unit тест амжилтгүй"
        return 1
    fi
    cd ..
    
    print_step "Admin Web unit тест ажиллуулж байна..."
    
    cd admin-web
    if npm test -- --watchAll=false; then
        print_success "Admin Web unit тест амжилттай"
    else
        print_error "Admin Web unit тест амжилтгүй"
        return 1
    fi
    cd ..
}

run_integration_tests() {
    print_step "Integration тест ажиллуулж байна..."
    
    # Start test environment
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for services to be ready
    print_step "Сервисүүд бэлтгэгдэхийг хүлээж байна..."
    sleep 10
    
    cd backend
    if npm run test:integration; then
        print_success "Integration тест амжилттай"
    else
        print_error "Integration тест амжилтгүй"
        return 1
    fi
    cd ..
    
    # Cleanup
    docker-compose -f docker-compose.test.yml down
}

run_e2e_tests() {
    print_step "E2E тест ажиллуулж байна..."
    
    # Start test environment
    docker-compose -f docker-compose.test.yml up -d
    
    # Wait for services to be ready
    print_step "Сервисүүд бэлтгэгдэхийг хүлээж байна..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/health > /dev/null; then
            print_success "Backend бэлэн боллоо"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            print_error "Backend бэлтгэгдэхэд хэтэрхий удаан зарлаа"
            docker-compose -f docker-compose.test.yml down
            return 1
        fi
    done
    
    cd backend
    if npm run test:e2e; then
        print_success "E2E тест амжилттай"
    else
        print_error "E2E тест амжилтгүй"
        docker-compose -f docker-compose.test.yml down
        return 1
    fi
    cd ..
    
    # Cleanup
    docker-compose -f docker-compose.test.yml down
}

run_linting() {
    print_step "Lint check ажиллуулж байна..."
    
    print_step "Backend lint check..."
    cd backend
    if npm run lint; then
        print_success "Backend lint check амжилттай"
    else
        print_error "Backend lint check амжилтгүй"
        return 1
    fi
    cd ..
    
    print_step "Admin Web lint check..."
    cd admin-web
    if npm run lint; then
        print_success "Admin Web lint check амжилттай"
    else
        print_error "Admin Web lint check амжилтгүй"
        return 1
    fi
    cd ..
    
    print_step "TypeScript type check..."
    
    cd backend
    if npm run type-check; then
        print_success "Backend type check амжилттай"
    else
        print_error "Backend type check амжилтгүй"
        return 1
    fi
    cd ..
    
    cd admin-web
    if npm run type-check; then
        print_success "Admin Web type check амжилттай"
    else
        print_error "Admin Web type check амжилтгүй"
        return 1
    fi
    cd ..
}

run_build_tests() {
    print_step "Build тест ажиллуулж байна..."
    
    print_step "Backend build test..."
    cd backend
    if npm run build; then
        print_success "Backend build амжилттай"
    else
        print_error "Backend build амжилтгүй"
        return 1
    fi
    cd ..
    
    print_step "Admin Web build test..."
    cd admin-web
    if npm run build; then
        print_success "Admin Web build амжилттай"
    else
        print_error "Admin Web build амжилтгүй"
        return 1
    fi
    cd ..
}

run_security_checks() {
    print_step "Хамгаалалтын шалгалт хийж байна..."
    
    # Check for secrets in code
    print_step "Код дотор нууц үг шалгаж байна..."
    if grep -r "password\|secret\|key\|token" --include="*.ts" --include="*.js" --include="*.dart" . | grep -v "test\|mock\|example\|node_modules" | grep -v "//\|/\*"; then
        print_warning "Код дотор нууц үг олдлоо. Шалгана уу!"
    else
        print_success "Код дотор нууц үг олдсонгүй"
    fi
    
    # Check dependencies for vulnerabilities
    print_step "Dependencies vulnerability check..."
    
    cd backend
    if npm audit --production; then
        print_success "Backend dependencies secure"
    else
        print_warning "Backend dependencies дотор vulnerability олдлоо"
    fi
    cd ..
    
    cd admin-web
    if npm audit --production; then
        print_success "Admin Web dependencies secure"
    else
        print_warning "Admin Web dependencies дотор vulnerability олдлоо"
    fi
    cd ..
}

generate_coverage_report() {
    print_step "Coverage report үүсгэж байна..."
    
    cd backend
    if npm run test:cov; then
        print_success "Backend coverage report үүсгэгдлээ"
        
        # Open coverage report if on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open coverage/lcov-report/index.html
        fi
    else
        print_error "Backend coverage report үүсгэхэд алдаа гарлаа"
    fi
    cd ..
}

show_test_summary() {
    local passed=$1
    local failed=$2
    
    echo ""
    echo -e "${COLOR_MAGENTA}┌────────────────────────────────────────────┐${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│            Тестийн дүн                    │${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}├────────────────────────────────────────────┤${COLOR_RESET}"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} Нийт тест: $(($passed + $failed))"
    echo -e "${COLOR_MAGENTA}│${COLOR_RESET} ${COLOR_GREEN}Амжилттай: $passed${COLOR_RESET}"
    
    if [ $failed -gt 0 ]; then
        echo -e "${COLOR_MAGENTA}│${COLOR_RESET} ${COLOR_RED}Амжилтгүй: $failed${COLOR_RESET}"
    else
        echo -e "${COLOR_MAGENTA}│${COLOR_RESET} ${COLOR_GREEN}Амжилтгүй: $failed${COLOR_RESET}"
    fi
    
    echo -e "${COLOR_MAGENTA}└────────────────────────────────────────────┘${COLOR_RESET}"
    echo ""
    
    if [ $failed -eq 0 ]; then
        print_success "Бүх тест амжилттай! 🎉"
        return 0
    else
        print_error "Зарим тест амжилтгүй боллоо"
        return 1
    fi
}

main() {
    echo -e "${COLOR_MAGENTA}"
    echo "┌────────────────────────────────────────────┐"
    echo "│    Продактивити Платформ Тест             │"
    echo "└────────────────────────────────────────────┘"
    echo -e "${COLOR_RESET}"
    
    TEST_TYPE=${1:-all}
    PASSED=0
    FAILED=0
    
    # Cleanup any existing test containers
    docker-compose -f docker-compose.test.yml down 2>/dev/null || true
    
    case $TEST_TYPE in
        unit)
            print_step "Unit тест ажиллуулж байна..."
            if run_unit_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            ;;
        
        integration)
            print_step "Integration тест ажиллуулж байна..."
            if run_integration_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            ;;
        
        e2e)
            print_step "E2E тест ажиллуулж байна..."
            if run_e2e_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            ;;
        
        lint)
            print_step "Lint тест ажиллуулж байна..."
            if run_linting; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            ;;
        
        build)
            print_step "Build тест ажиллуулж байна..."
            if run_build_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            ;;
        
        security)
            print_step "Security тест ажиллуулж байна..."
            if run_security_checks; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            ;;
        
        coverage)
            print_step "Coverage report үүсгэж байна..."
            generate_coverage_report
            ;;
        
        all)
            print_step "Бүх тест ажиллуулж байна..."
            
            # Run linting first
            if run_linting; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            
            # Run unit tests
            if run_unit_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            
            # Run integration tests
            if run_integration_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            
            # Run E2E tests
            if run_e2e_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            
            # Run build tests
            if run_build_tests; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            
            # Run security checks
            if run_security_checks; then
                ((PASSED++))
            else
                ((FAILED++))
            fi
            
            # Generate coverage report
            generate_coverage_report
            ;;
        
        *)
            print_error "Буруу тест төрөл: $TEST_TYPE"
            echo "Хэрэглэх: $0 [unit|integration|e2e|lint|build|security|coverage|all]"
            exit 1
            ;;
    esac
    
    # Cleanup
    docker-compose -f docker-compose.test.yml down 2>/dev/null || true
    
    # Show summary
    if [ "$TEST_TYPE" != "coverage" ]; then
        show_test_summary $PASSED $FAILED
    fi
}

# Run main function
main "$@"