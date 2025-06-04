
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  name: z.string().min(3, { message: "نام باید حداقل ۳ حرف داشته باشد" }),
  email: z.string().email({ message: "ایمیل نامعتبر است" }),
  password: z.string().min(8, { message: "رمز عبور باید حداقل ۸ کاراکتر باشد" }),
  confirmPassword: z.string().min(8, { message: "تایید رمز عبور باید حداقل ۸ کاراکتر باشد" }),
  terms: z.boolean().refine(value => value === true, {
    message: "پذیرش قوانین و مقررات الزامی است"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "رمز عبور و تایید آن باید یکسان باشند",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false
    },
  });

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    console.log("Registration attempt:", data);
    
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        if (error.message.includes('User already registered')) {
          toast({
            title: "خطا در ثبت‌نام",
            description: "این ایمیل قبلاً ثبت‌نام شده است. لطفاً وارد شوید",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطا در ثبت‌نام",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (authData.user) {
        toast({
          title: "ثبت‌نام موفقیت‌آمیز",
          description: "به چی کو خوش آمدید. اکنون می‌توانید از امکانات استفاده کنید",
          variant: "default",
        });
        navigate("/");
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "خطا در ثبت‌نام",
        description: "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-violet-600">ثبت‌نام در چی کو</CardTitle>
          <CardDescription className="text-gray-500">
            حساب کاربری جدید ایجاد کنید و از امکانات چی کو بهره‌مند شوید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                      <User className="h-5 w-5 text-fuchsia-600" />
                      نام و نام خانوادگی
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="نام و نام خانوادگی خود را وارد کنید"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                      <Mail className="h-5 w-5 text-fuchsia-600" />
                      ایمیل
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@email.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                      <Lock className="h-5 w-5 text-fuchsia-600" />
                      رمز عبور
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-violet-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-violet-600" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 font-medium">
                      <Lock className="h-5 w-5 text-fuchsia-600" />
                      تایید رمز عبور
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="********"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-violet-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-violet-600" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-violet-600"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-gray-700 font-medium">
                        <a href="#" className="text-violet-600 hover:underline">قوانین و مقررات</a> چی کو را می‌پذیرم
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-lg py-6"
                disabled={isLoading}
              >
                {isLoading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-gray-500 text-sm">
            قبلا ثبت‌نام کرده‌اید؟ <a href="/login" className="text-violet-600 hover:underline">ورود به حساب</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterPage;
