import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';

interface SwipeableItemProps {
    children: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    accentColor?: string;
}

const SWIPE_THRESHOLD = 80;

const SwipeableTransactionItem: React.FC<SwipeableItemProps> = ({
    children,
    onEdit,
    onDelete,
    accentColor = '#f43f5e'
}) => {
    const [translateX, setTranslateX] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const isDraggingRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        startXRef.current = clientX;
        currentXRef.current = translateX;
        isDraggingRef.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDraggingRef.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const diff = clientX - startXRef.current;
        let newTranslate = currentXRef.current + diff;

        newTranslate = Math.max(-160, Math.min(0, newTranslate));
        setTranslateX(newTranslate);
    };

    const handleTouchEnd = () => {
        isDraggingRef.current = false;

        if (translateX < -SWIPE_THRESHOLD) {
            setTranslateX(-160);
            setIsOpen(true);
        } else {
            setTranslateX(0);
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setTranslateX(0);
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside as any);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside as any);
        };
    }, [isOpen]);

    const handleEdit = () => {
        setTranslateX(0);
        setIsOpen(false);
        onEdit();
    };

    const handleDelete = () => {
        setTranslateX(0);
        setIsOpen(false);
        onDelete();
    };

    return (
        <div ref={containerRef} className="relative overflow-hidden rounded-xl">
            <div className="absolute inset-y-0 right-0 flex">
                <button
                    onClick={handleEdit}
                    className="w-20 flex items-center justify-center bg-blue-500 text-white transition-opacity"
                    style={{ opacity: Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD) }}
                >
                    <div className="flex flex-col items-center gap-1">
                        <Pencil size={18} />
                        <span className="text-xs font-medium">Sửa</span>
                    </div>
                </button>
                <button
                    onClick={handleDelete}
                    className="w-20 flex items-center justify-center bg-rose-500 text-white transition-opacity"
                    style={{ opacity: Math.min(1, Math.abs(translateX) / SWIPE_THRESHOLD) }}
                >
                    <div className="flex flex-col items-center gap-1">
                        <Trash2 size={18} />
                        <span className="text-xs font-medium">Xóa</span>
                    </div>
                </button>
            </div>

            <div
                className="relative bg-white transition-transform duration-200 ease-out"
                style={{
                    transform: `translateX(${translateX}px)`,
                    transitionDuration: isDraggingRef.current ? '0ms' : '200ms'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};

export default SwipeableTransactionItem;
